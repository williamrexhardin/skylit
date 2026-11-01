package com.wesbos.homehq;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.provider.Settings;
import android.util.Base64;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;

/** Local-only control of Spotify's Android media session. No OAuth, network or storage. */
final class SpotifySessions {
  static final String PACKAGE="com.spotify.music";
  private final Context context;
  private final ComponentName listener;
  private Bitmap lastArt;
  private String encodedArt="";
  SpotifySessions(Context context){this.context=context;listener=new ComponentName(context,SpotifyListener.class);}
  boolean installed(){return context.getPackageManager().getLaunchIntentForPackage(PACKAGE)!=null;}
  boolean allowed(){String raw=Settings.Secure.getString(context.getContentResolver(),"enabled_notification_listeners");if(raw!=null)for(String value:raw.split(":"))if(listener.equals(ComponentName.unflattenFromString(value)))return true;return false;}
  private MediaController controller(){
    if(!allowed())return null;
    MediaSessionManager manager=(MediaSessionManager)context.getSystemService(Context.MEDIA_SESSION_SERVICE);
    if(manager==null)return null;
    MediaController fallback=null;
    for(MediaController c:manager.getActiveSessions(listener))if(PACKAGE.equals(c.getPackageName())){
      PlaybackState s=c.getPlaybackState();if(s!=null&&s.getState()==PlaybackState.STATE_PLAYING)return c;
      if(fallback==null)fallback=c;
    }return fallback;
  }
  private static String text(MediaMetadata m,String key){String s=m==null?null:m.getString(key);return s==null?"":s.substring(0,Math.min(s.length(),240));}
  private String artwork(MediaMetadata m){
    Bitmap image=m==null?null:m.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART);
    if(image==null&&m!=null)image=m.getBitmap(MediaMetadata.METADATA_KEY_ART);
    if(image==lastArt)return encodedArt;
    lastArt=image;encodedArt="";
    if(image!=null&&!image.isRecycled()){
      float scale=Math.min(1f,160f/Math.max(image.getWidth(),image.getHeight()));
      Bitmap small=Bitmap.createScaledBitmap(image,Math.max(1,Math.round(image.getWidth()*scale)),Math.max(1,Math.round(image.getHeight()*scale)),true);
      ByteArrayOutputStream bytes=new ByteArrayOutputStream();small.compress(Bitmap.CompressFormat.JPEG,75,bytes);
      if(small!=image)small.recycle();if(bytes.size()<=49152)encodedArt="data:image/jpeg;base64,"+Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP);
    }return encodedArt;
  }
  synchronized String status(){
    JSONObject out=new JSONObject();try{
      out.put("supported",true).put("installed",installed()).put("permission",allowed());
      MediaController c=controller();out.put("active",c!=null);
      if(c==null){lastArt=null;encodedArt="";return out.toString();}
      PlaybackState s=c.getPlaybackState();MediaMetadata m=c.getMetadata();long actions=s==null?0:s.getActions();
      boolean playing=s!=null&&s.getState()==PlaybackState.STATE_PLAYING;
      out.put("playing",playing).put("buffering",s!=null&&(s.getState()==PlaybackState.STATE_BUFFERING||s.getState()==PlaybackState.STATE_CONNECTING))
        .put("title",text(m,MediaMetadata.METADATA_KEY_TITLE)).put("artist",text(m,MediaMetadata.METADATA_KEY_ARTIST)).put("art",artwork(m))
        .put("canPlay",(actions&(playing?PlaybackState.ACTION_PAUSE:PlaybackState.ACTION_PLAY))!=0||(actions&PlaybackState.ACTION_PLAY_PAUSE)!=0)
        .put("canPrevious",(actions&PlaybackState.ACTION_SKIP_TO_PREVIOUS)!=0).put("canNext",(actions&PlaybackState.ACTION_SKIP_TO_NEXT)!=0);
    }catch(Exception e){try{out.put("active",false).put("error",true);}catch(Exception ignored){}}
    return out.toString();
  }
  synchronized boolean command(String action){
    try{MediaController c=controller();if(c==null)return false;PlaybackState s=c.getPlaybackState();if(s==null)return false;
      long flags=s.getActions();MediaController.TransportControls controls=c.getTransportControls();
      if("play".equals(action)&&(flags&(PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PLAY_PAUSE))!=0)controls.play();
      else if("pause".equals(action)&&(flags&(PlaybackState.ACTION_PAUSE|PlaybackState.ACTION_PLAY_PAUSE))!=0)controls.pause();
      else if("previous".equals(action)&&(flags&PlaybackState.ACTION_SKIP_TO_PREVIOUS)!=0)controls.skipToPrevious();
      else if("next".equals(action)&&(flags&PlaybackState.ACTION_SKIP_TO_NEXT)!=0)controls.skipToNext();
      else return false;return true;
    }catch(Exception ignored){return false;}
  }
  void open(Activity activity){Intent intent=context.getPackageManager().getLaunchIntentForPackage(PACKAGE);if(intent!=null)try{activity.startActivity(intent);}catch(Exception ignored){}}
  void permission(Activity activity){try{activity.startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));}catch(Exception ignored){}}
}

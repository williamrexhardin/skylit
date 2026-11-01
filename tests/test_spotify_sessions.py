"""Exercise the actual native Spotify controller with deterministic Android doubles."""
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
ROOT=Path(__file__).resolve().parents[1]

STUBS={
'android/content/Context.java': '''package android.content; public class Context {public static final String MEDIA_SESSION_SERVICE="media"; public android.media.session.MediaSessionManager manager=new android.media.session.MediaSessionManager(); public android.content.pm.PackageManager getPackageManager(){return new android.content.pm.PackageManager();} public Object getContentResolver(){return null;} public Object getSystemService(String s){return manager;}}''',
'android/content/pm/PackageManager.java': '''package android.content.pm; public class PackageManager {public android.content.Intent getLaunchIntentForPackage(String p){return new android.content.Intent(p);}}''',
'android/content/Intent.java': '''package android.content; public class Intent {public Intent(String s){}}''',
'android/content/ComponentName.java': '''package android.content; public class ComponentName {final String value; public ComponentName(Context c,Class<?> t){value=t.getName();} private ComponentName(String v){value=v;} public static ComponentName unflattenFromString(String s){return new ComponentName(s);} public boolean equals(Object o){return o instanceof ComponentName&&value.equals(((ComponentName)o).value);}}''',
'android/app/Activity.java': '''package android.app; public class Activity extends android.content.Context {public void startActivity(android.content.Intent i){}}''',
'android/provider/Settings.java': '''package android.provider; public class Settings {public static final String ACTION_NOTIFICATION_LISTENER_SETTINGS="settings"; public static class Secure {public static String allowed="com.wesbos.homehq.SpotifyListener"; public static String getString(Object c,String k){return allowed;}}}''',
'android/service/notification/NotificationListenerService.java': '''package android.service.notification; public class NotificationListenerService {}''',
'android/graphics/Bitmap.java': '''package android.graphics; public class Bitmap {public static class CompressFormat {public static final CompressFormat JPEG=new CompressFormat();} public boolean isRecycled(){return false;} public int getWidth(){return 10;} public int getHeight(){return 10;} public static Bitmap createScaledBitmap(Bitmap b,int w,int h,boolean f){return b;} public boolean compress(CompressFormat f,int q,java.io.OutputStream s){return true;} public void recycle(){}}''',
'android/util/Base64.java': '''package android.util; public class Base64 {public static final int NO_WRAP=2;public static String encodeToString(byte[] b,int f){return "";}}''',
'android/media/MediaMetadata.java': '''package android.media; public class MediaMetadata {public static final String METADATA_KEY_ALBUM_ART="art",METADATA_KEY_ART="art2",METADATA_KEY_TITLE="title",METADATA_KEY_ARTIST="artist"; public String getString(String s){return s;} public android.graphics.Bitmap getBitmap(String k){return null;}}''',
'android/media/session/PlaybackState.java': '''package android.media.session; public class PlaybackState {public static final int STATE_PLAYING=3,STATE_BUFFERING=6,STATE_CONNECTING=8;public static final long ACTION_PAUSE=2,ACTION_PLAY=4,ACTION_SKIP_TO_PREVIOUS=16,ACTION_SKIP_TO_NEXT=32,ACTION_PLAY_PAUSE=512; public int state=3;public long actions=54;public int getState(){return state;}public long getActions(){return actions;}}''',
'android/media/session/MediaController.java': '''package android.media.session; public class MediaController {public final String name;public PlaybackState state=new PlaybackState();public TransportControls controls=new TransportControls();public MediaController(String n){name=n;}public String getPackageName(){return name;}public PlaybackState getPlaybackState(){return state;}public android.media.MediaMetadata getMetadata(){return new android.media.MediaMetadata();}public TransportControls getTransportControls(){return controls;}public static class TransportControls{public String last="";public void play(){last="play";}public void pause(){last="pause";}public void skipToNext(){last="next";}public void skipToPrevious(){last="previous";}}}''',
'android/media/session/MediaSessionManager.java': '''package android.media.session; public class MediaSessionManager {public int reads;public java.util.List<MediaController> sessions=new java.util.ArrayList<>();public java.util.List<MediaController> getActiveSessions(android.content.ComponentName c){reads++;return sessions;}}''',
'org/json/JSONObject.java': '''package org.json; public class JSONObject {public java.util.Map<String,Object> data=new java.util.HashMap<>();public JSONObject put(String k,Object v){data.put(k,v);return this;}public String toString(){return data.toString();}}''',
'com/wesbos/homehq/SpotifySessionsTest.java': '''package com.wesbos.homehq;
import android.media.session.*;import android.provider.Settings;
public class SpotifySessionsTest {
 static void ok(boolean b){if(!b)throw new AssertionError();}
 public static void main(String[] args){
  android.content.Context context=new android.content.Context();SpotifySessions bridge=new SpotifySessions(context);
  MediaController other=new MediaController("com.example.player"),spoof=new MediaController("com.spotify.music.fake"),spotify=new MediaController("com.spotify.music"),paused=new MediaController("com.spotify.music");paused.state.state=2;
  context.manager.sessions.add(other);context.manager.sessions.add(spoof);
  ok(!bridge.command("pause"));ok(other.controls.last.isEmpty()&&spoof.controls.last.isEmpty());
  context.manager.sessions.add(paused);context.manager.sessions.add(spotify);
  ok(bridge.command("pause"));ok(spotify.controls.last.equals("pause")&&paused.controls.last.isEmpty());
  ok(bridge.command("next"));ok(spotify.controls.last.equals("next"));
  ok(!bridge.command("seek"));ok(!bridge.command("PLAY"));
  spotify.state.actions=2;ok(!bridge.command("next"));ok(bridge.command("pause"));
  spotify.state.actions=PlaybackState.ACTION_PLAY_PAUSE;ok(bridge.command("play"));
  ok(bridge.status().contains("active=true"));
  Settings.Secure.allowed="unrelated";int reads=context.manager.reads;
  ok(!bridge.command("play"));ok(bridge.status().contains("active=false"));ok(context.manager.reads==reads);
  Settings.Secure.allowed=null;ok(!bridge.allowed());
  Settings.Secure.allowed="unrelated:com.wesbos.homehq.SpotifyListener";ok(bridge.allowed());
  context.manager.sessions.clear();ok(!bridge.command("play"));ok(bridge.status().contains("active=false"));
 }
}'''
}
class SpotifySessionsTest(unittest.TestCase):
    def test_spotify_only_transport_permission_and_supported_actions(self):
        config=ROOT/'.local/build.json'
        java=Path(json.loads(config.read_text())['java'])/'bin' if config.exists() else Path(shutil.which('javac') or '/missing/javac').parent
        if not (java/'javac').exists() or not (java/'java').exists():self.skipTest('JDK required')
        with tempfile.TemporaryDirectory() as tmp:
            base=Path(tmp)
            for file,content in STUBS.items():
                path=base/file;path.parent.mkdir(parents=True,exist_ok=True);path.write_text(content)
            sources=[str(p) for p in base.rglob('*.java')]+[str(ROOT/'android/src/com/wesbos/homehq'/name) for name in ['SpotifySessions.java','SpotifyListener.java']]
            subprocess.run([str(java/'javac'),'-d',str(base),*sources],check=True,capture_output=True,text=True)
            result=subprocess.run([str(java/'java'),'-cp',str(base),'com.wesbos.homehq.SpotifySessionsTest'],capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)

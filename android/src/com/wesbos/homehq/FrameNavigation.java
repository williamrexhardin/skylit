package com.wesbos.homehq;

import android.app.*;
import android.content.*;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.Button;
import org.json.JSONObject;

/** Owner-enabled, touchable return button. No accessibility or screen-reading access. */
public final class FrameNavigation extends Service {
  private static final String PREFS="skylit-navigation",CHANNEL="skylit-navigation";
  static volatile boolean dashboardVisible;
  private final Handler handler=new Handler(Looper.getMainLooper());
  private WindowManager manager;
  private Button button;
  private WindowManager.LayoutParams layout;
  private long deadline;
  private boolean awaitingGrant;
  private static boolean enabled(Context c){return c.getSharedPreferences(PREFS,MODE_PRIVATE).getBoolean("enabled",false);}
  static String status(Context c){JSONObject j=new JSONObject();try{j.put("supported",true).put("enabled",enabled(c)).put("permission",Settings.canDrawOverlays(c));}catch(Exception ignored){}return j.toString();}
  static boolean ready(Context c){return enabled(c)&&Settings.canDrawOverlays(c);}
  static void restore(Context c){if(enabled(c)&&Settings.canDrawOverlays(c))start(c);}
  private static void start(Context c){try{Intent i=new Intent(c,FrameNavigation.class);if(Build.VERSION.SDK_INT>=26)c.startForegroundService(i);else c.startService(i);}catch(RuntimeException ignored){}}
  static void configure(Activity a,boolean value){
    a.getSharedPreferences(PREFS,MODE_PRIVATE).edit().putBoolean("enabled",value).apply();
    if(!value){a.stopService(new Intent(a,FrameNavigation.class));return;}
    start(a); // Wait for an explicit permission grant so the new button can bring the owner back.
    if(!Settings.canDrawOverlays(a))try{a.startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,Uri.parse("package:"+a.getPackageName())));}catch(ActivityNotFoundException ignored){}
  }
  private final Runnable tick=new Runnable(){public void run(){
    if(!enabled(FrameNavigation.this)){stopSelf();return;}
    if(Settings.canDrawOverlays(FrameNavigation.this)){
      if(awaitingGrant){awaitingGrant=false;startActivity(new Intent(FrameNavigation.this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("return_home",true));}
      if(dashboardVisible)hide();else show();
    }else{hide();if(SystemClock.elapsedRealtime()>deadline){stopSelf();return;}}
    handler.postDelayed(this,500);
  }};
  @Override public void onCreate(){super.onCreate();manager=(WindowManager)getSystemService(WINDOW_SERVICE);deadline=SystemClock.elapsedRealtime()+120000;awaitingGrant=!Settings.canDrawOverlays(this);
    Intent home=new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("return_home",true);
    PendingIntent pending=PendingIntent.getActivity(this,410,home,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
    Notification.Builder notice;
    if(Build.VERSION.SDK_INT>=26){NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);nm.createNotificationChannel(new NotificationChannel(CHANNEL,"Skylit return button",NotificationManager.IMPORTANCE_LOW));notice=new Notification.Builder(this,CHANNEL);}else notice=new Notification.Builder(this);
    startForeground(410,notice.setSmallIcon(android.R.drawable.ic_menu_revert).setContentTitle("Skylit return button is on").setContentText("Tap the floating Skylit button to return from another app.").setContentIntent(pending).setOngoing(true).build());handler.post(tick);
  }
  @Override public int onStartCommand(Intent intent,int flags,int id){return START_STICKY;}
  @Override public IBinder onBind(Intent intent){return null;}
  private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
  private void show(){if(button!=null)return;
    button=new Button(this);button.setText("‹ Skylit");button.setTextSize(16);button.setTextColor(Color.WHITE);button.setContentDescription("Return to Skylit; drag to move");
    GradientDrawable background=new GradientDrawable();background.setColor(Color.rgb(65,55,46));background.setCornerRadius(dp(24));button.setBackground(background);
    layout=new WindowManager.LayoutParams(dp(112),dp(52),Build.VERSION.SDK_INT>=26?WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY:WindowManager.LayoutParams.TYPE_PHONE,WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,PixelFormat.TRANSLUCENT);
    layout.gravity=Gravity.TOP|Gravity.LEFT;layout.x=getSharedPreferences(PREFS,MODE_PRIVATE).getInt("x",dp(16));layout.y=getSharedPreferences(PREFS,MODE_PRIVATE).getInt("y",dp(80));clamp();
    button.setOnClickListener(v->startActivity(new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP).putExtra("return_home",true)));
    button.setOnTouchListener(new View.OnTouchListener(){float x,y;int left,top;boolean moved;
      public boolean onTouch(View v,MotionEvent e){switch(e.getActionMasked()){
        case MotionEvent.ACTION_DOWN:x=e.getRawX();y=e.getRawY();left=layout.x;top=layout.y;moved=false;return true;
        case MotionEvent.ACTION_MOVE:if(Math.hypot(e.getRawX()-x,e.getRawY()-y)>dp(8))moved=true;if(moved){layout.x=left+Math.round(e.getRawX()-x);layout.y=top+Math.round(e.getRawY()-y);clamp();try{manager.updateViewLayout(button,layout);}catch(RuntimeException ignored){}}return true;
        case MotionEvent.ACTION_UP:if(!moved)v.performClick();else getSharedPreferences(PREFS,MODE_PRIVATE).edit().putInt("x",layout.x).putInt("y",layout.y).apply();return true;
        case MotionEvent.ACTION_CANCEL:return true;
      }return false;}
    });
    try{manager.addView(button,layout);}catch(RuntimeException e){button=null;}
  }
  private void clamp(){android.util.DisplayMetrics m=getResources().getDisplayMetrics();layout.x=Math.max(0,Math.min(layout.x,m.widthPixels-layout.width));layout.y=Math.max(0,Math.min(layout.y,m.heightPixels-layout.height));}
  private void hide(){if(button!=null){try{manager.removeView(button);}catch(RuntimeException ignored){}button=null;}}
  @Override public void onDestroy(){handler.removeCallbacksAndMessages(null);hide();stopForeground(true);super.onDestroy();}
}

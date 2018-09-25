var app = require("application");
var Toast = require("nativescript-toast");
var permissions = require("~/util/PermissionUtil")

// native APIs
var WindowManager = android.view.WindowManager;
var Paint = android.graphics.Paint;
var Button = android.widget.Button;
var Resources = android.content.res.Resources;
var Color = android.graphics.Color;
var Context = android.content.Context;
var PixelFormat = android.graphics.PixelFormat;
var Gravity = android.view.Gravity;
var TextView = android.widget.TextView;
var BitmapFactory = android.graphics.BitmapFactory;
var Bitmap = android.graphics.Bitmap;
var TypedValue = android.util.TypedValue;
var SeekBar = android.widget.SeekBar;
var LayoutParams = android.view.ViewGroup.LayoutParams;



/******************************
 *          PAINTS            *
 ******************************/


var DIALOG_FILL = new Paint();
DIALOG_FILL.setColor(Color.parseColor("#efede9")); // light grey

var DIM_BACKGROUND = new Paint();
DIM_BACKGROUND.setColor(Color.BLACK);

var ICON_FILL = new Paint();
ICON_FILL.setColor(Color.parseColor("#2EC4B6")); //turquoise

var ICON_BACK_FILL = new Paint();
ICON_BACK_FILL.setColor(Color.WHITE);

// CONSTANTS
var SCREEN_WIDTH = Resources.getSystem().getDisplayMetrics().widthPixels;
var SCREEN_HEIGHT = Resources.getSystem().getDisplayMetrics().heightPixels;
var DIALOG_WIDTH = 0.8 * SCREEN_WIDTH;
var DIALOG_HEIGHT = 0.4 * SCREEN_HEIGHT;
var LEFT = 0.1 * SCREEN_WIDTH;
var RIGHT = LEFT + DIALOG_WIDTH;
var TOP = (SCREEN_HEIGHT - DIALOG_HEIGHT) / 2;
var BOTTOM = TOP + DIALOG_HEIGHT;
var ICON_RADIUS = 0.13 * DIALOG_WIDTH;
var CORNER_RADIUS = 15;


var context = app.android.context;
var windowManager = context.getSystemService(Context.WINDOW_SERVICE);

// Custom DialogView
var DialogView = android.view.View.extend({
	onDraw: function (canvas) {
		DIM_BACKGROUND.setAlpha(128); // 50% dimness
		canvas.drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, DIM_BACKGROUND);
		canvas.drawRect(LEFT, TOP, RIGHT, BOTTOM, DIALOG_FILL);

		// add icon frame
		var iconLeft = SCREEN_WIDTH / 2 - ICON_RADIUS;
		var iconRight = iconLeft + 2 * ICON_RADIUS;
		var iconTop = (SCREEN_HEIGHT - DIALOG_HEIGHT) / 2 - 1 * ICON_RADIUS;
		var iconBottom = iconTop + 2 * ICON_RADIUS;
		canvas.drawRect(iconLeft - 10, iconTop - 10, iconRight + 10, iconBottom + 10, ICON_BACK_FILL);
		canvas.drawRect(iconLeft, iconTop, iconRight, iconBottom, ICON_FILL);

		// add icon
		var icon_id = context.getResources().getIdentifier("ic_habitlab_white", "drawable", context.getPackageName());
		var bitmap = context.getResources().getDrawable(icon_id).getBitmap();
		var hToWRatio = bitmap.getWidth() / bitmap.getHeight();
		var newHeight = 1.5 * ICON_RADIUS;
		var newWidth = newHeight * hToWRatio;
		var icon = Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, false);

		var bitmapLeft = iconLeft + (iconRight - iconLeft) / 2 - newWidth / 2;
		var bitmapTop = iconTop + (iconBottom - iconTop) / 2 - newHeight * 9 / 16;

		canvas.drawBitmap(icon, bitmapLeft, bitmapTop, ICON_FILL);
	}
});


var dialog;
var text;
var posButton;
var negButtons;
var seekBar;
var labelText;
var setTime = 10;
exports.showSliderOverlay = function (msg, callback, context) {
	if (permissions.checkSystemOverlayPermission()) {
		// add whole screen view
		var dialogParams = new WindowManager.LayoutParams(WindowManager.LayoutParams.MATCH_PARENT,
			WindowManager.LayoutParams.MATCH_PARENT, permissions.getOverlayType(),
			WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
			WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
			PixelFormat.TRANSLUCENT);
		dialogParams.gravity = Gravity.LEFT | Gravity.TOP;
		dialog = new DialogView(context);
		windowManager.addView(dialog, dialogParams);

		// add text
		var textParams = new WindowManager.LayoutParams(0.8 * DIALOG_WIDTH, 0.65 * DIALOG_HEIGHT,
			0.1 * (SCREEN_WIDTH + DIALOG_WIDTH), 0.30 * SCREEN_HEIGHT,
			permissions.getOverlayType(), 0, PixelFormat.TRANSLUCENT);
		textParams.gravity = Gravity.LEFT | Gravity.TOP;
		text = new TextView(context);
		text.setText(msg);
		text.setTextSize(TypedValue.COMPLEX_UNIT_PT, 10);
		text.setTextColor(Color.BLACK);
		text.setHorizontallyScrolling(false);
		text.setGravity(Gravity.CENTER);
		windowManager.addView(text, textParams);


		//Time label
		var labelParams = new WindowManager.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT,
			0.25*SCREEN_WIDTH, 0.15 * DIALOG_HEIGHT,
			permissions.getOverlayType(), 0, PixelFormat.TRANSLUCENT);
		labelText = new TextView(context);
		labelText.setText(setTime + " mins");
		labelText.setTextSize(TypedValue.COMPLEX_UNIT_PT, 5);
		labelText.setTextColor(Color.parseColor("#5f5e5d"));
		labelText.setHorizontallyScrolling(false);
		windowManager.addView(labelText, labelParams);


		//add seek bar
		var seekParams = new WindowManager.LayoutParams( 0.8 * DIALOG_WIDTH, LayoutParams.WRAP_CONTENT,
			0, 0.1*DIALOG_HEIGHT,
			permissions.getOverlayType(), 0, PixelFormat.TRANSLUCENT);
		seekBar = new SeekBar(context);
		seekBar.setMax(30);
		seekBar.setProgress(10);
		var progressChangedValue = 0;
		seekBar.setOnSeekBarChangeListener(new android.widget.SeekBar.OnSeekBarChangeListener({
			onProgressChanged: function(seekBar, progress, fromUser) {
				progressChangedValue = progress;
				if (labelText) {
					labelText.setText(progressChangedValue + " mins");
				}
			},
			onStartTrackingTouch: function(seekBar) {

			},
			onStopTrackingTouch: function(seekBar){
				setTime = progressChangedValue;
			}
		}));
		windowManager.addView(seekBar, seekParams);


		// add positive button
		var posButtonParams = new WindowManager.LayoutParams(0.35 * DIALOG_WIDTH,
			0.2 * DIALOG_HEIGHT, 0.1 * (SCREEN_WIDTH + DIALOG_WIDTH),
			0.35 * SCREEN_HEIGHT + 0.6 * DIALOG_HEIGHT, permissions.getOverlayType(),
			WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
			WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
			PixelFormat.TRANSLUCENT);
		posButtonParams.gravity = Gravity.LEFT | Gravity.TOP;
		posButton = new Button(context);
		posButton.setText("Ok");
		posButton.setTextColor(Color.WHITE);
		posButton.getBackground().setColorFilter(Color.parseColor("#2EC4B6"), android.graphics.PorterDuff.Mode.MULTIPLY);
		posButton.setOnClickListener(new android.view.View.OnClickListener({
			onClick: function() {
				if (callback) {
					callback(setTime);
				}
				// Toast.makeText('You have ' + setTime + ' mins remaining').show();
				exports.removeSliderOverlay();
			}
		}));
		windowManager.addView(posButton, posButtonParams);

		// add neg button
		var negButtonParams = new WindowManager.LayoutParams(0.35 * DIALOG_WIDTH,
			0.2 * DIALOG_HEIGHT, 0.1 * SCREEN_WIDTH + 0.55 * DIALOG_WIDTH,
			0.35 * SCREEN_HEIGHT + 0.6 * DIALOG_HEIGHT, permissions.getOverlayType(),
			WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL |
			WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
			PixelFormat.TRANSLUCENT);
		negButtonParams.gravity = Gravity.LEFT | Gravity.TOP;
		negButtons = new Button(context);
		negButtons.setText("Not Now");
		negButtons.setTextColor(Color.WHITE);
		negButtons.getBackground().setColorFilter(Color.parseColor("#5f5e5d"), android.graphics.PorterDuff.Mode.MULTIPLY);
		negButtons.setOnClickListener(new android.view.View.OnClickListener({
			onClick: function() {
				exports.removeSliderOverlay();
			}
		}));
		windowManager.addView(negButtons, negButtonParams);
	} else {
        permissions.launchSystemOverlayIntent(); 
    }
}



exports.removeSliderOverlay = function () {
	if (dialog) {
		windowManager.removeView(dialog);
		dialog = undefined;
	}

	if (text) {
		windowManager.removeView(text);
		text = undefined;
	}

	if (posButton) {
		windowManager.removeView(posButton);
		posButton = undefined;
	}

	if (negButtons) {
		windowManager.removeView(negButtons);
		negButtons = undefined;
	}

	if (seekBar) {
		windowManager.removeView(seekBar);
		seekBar = undefined;
	}

	if (labelText) {
		windowManager.removeView(labelText);
		labelText = undefined;
	}

	setTime = 10;
}

var application = require("application");
var StorageUtil = require("~/util/StorageUtil");
var PermissionUtil = require("~/util/PermissionUtil");
var frameModule = require("ui/frame");
var fancyAlert = require('nativescript-fancyalert');
var page;
var nameField;


exports.pageLoaded = function(args) {

	page = args.object;
	nameField = page.getViewById("name");
	nameField.text = StorageUtil.getName() || "";

  var viewFile = "";
  var view = "";

	//Sets up DB if necessary.
	StorageUtil.checkDBSetup()
	if (!StorageUtil.hasAcceptedTerms()) {
		viewFile = 'onboarding/termsView'
		view = 'termsView'
	} else if (StorageUtil.isTutorialComplete()) {
    viewFile = 'progressView';
    view = 'progressView';
  } else if (StorageUtil.isOnboardingComplete()) {
    viewFile = 'goalsView';
    view = 'goalsView';
  } else if (PermissionUtil.checkAccessibilityPermission() && (StorageUtil.getUserID('userID') != "noIDFound")) {
    // Checks to see if accessibility is enabled AND they set up the database.
    viewFile = 'goalsView';
    view = 'goalsView';
    if (!StorageUtil.isOnboardingComplete()) {
      StorageUtil.setOnboardingComplete();
      StorageUtil.addLogEvents([{setValue: new Date().toLocaleString(), category: 'navigation', index: 'finished_onboarding'}]);
    }
  }

  if (view) {
    frameModule.topmost().navigate({
      moduleName: 'views/' + viewFile + '/' + view,
      clearHistory: view === 'progressView' || view === 'goalsView'
    });
  } else {
    StorageUtil.setUpDB();
  }
};

// Only lets the user continue past the first slide if a name is entered
// else, a dialog appears
exports.checkNameNextPage = function(args) {
	var name = nameField.text;
	if (name === "") {
	  fancyAlert.TNSFancyAlert.showError("Not so fast!", "Please enter your name to continue", "OK");
	} else {
		StorageUtil.setName(name.trim());
		frameModule.topmost().navigate('views/onboarding/askForEmailView/askForEmailView');
	}
};

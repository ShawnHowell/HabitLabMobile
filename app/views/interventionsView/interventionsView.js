var StorageUtil = require("~/util/StorageUtil");
var IM = require('~/interventions/InterventionManager');
var ID = require('~/interventions/InterventionData');
var Toast = require('nativescript-toast');
var fancyAlert = require("nativescript-fancyalert");
var gestures = require("ui/gestures").GestureTypes;
var builder = require('ui/builder');
var frameModule = require('ui/frame');
var FancyAlert = require("~/util/FancyAlert");
var drawer;
var page;
var interventionList;

var events;
var currentSearch;
var search;
var layouts = {};

exports.onSearch = function(args) {
  if (args.object.text !== currentSearch) {
    Object.keys(layouts).forEach(function(key) {
      layouts[key].removeChildren();
    });
    currentSearch = args.object.text;
    setUpList(args.object.text.toLowerCase());
  }
  args.object.dismissSoftInput();
};

exports.onShowSearch = function(args) {
  search.visibility = 'visible';
  args.object.visibility = 'collapse';
  currentSearch = "";
};

var createItem = function(info)  {
  var item = builder.load({
    path: 'shared/nudgeelem',
    name: 'nudgeelem',
    page: page
  });

  item.id = 'item' + item.id;
  item.className = 'intervention-grid';
  item.getViewById('firstrow').className = info.level + '-level';
  
  var image = item.getViewById('icon');
  image.src = info.icon;
  image.className = 'intervention-icon';

  var label = item.getViewById("name");
  label.text = info.name;
  label.className = 'intervention-label';

  var description = item.getViewById("description");
  description.text = info.summary;
  description.className = 'intervention-description';

  var options = {
    moduleName: 'views/detailView/detailView',
    context: { info: info },
    animated: true,
    transition: {
      name: "slide",
      duration: 380,
      curve: "easeIn"
    }
  };
  item.on("tap, touch", function(args) {
    if (args.eventName === 'tap') {
      frameModule.topmost().navigate(options);
    } else {
      if (args.action === 'down') {
        item.backgroundColor = '#F5F5F5';
      } else if (args.action === 'up' || args.action === 'cancel') {
        item.backgroundColor = '#FFFFFF';
      }
    }
  });

  return item;
};

var setUpList = function(filter) {
  var order = {easy: 0, medium: 1, hard: 2};
  interventionList = ID.interventionDetails;

  if (filter) {
    console.log('1');
    interventionList = interventionList.filter(function (nudge) {
      console.dir(nudge);
      console.log('here');
      return nudge.name.toLowerCase().includes(filter) || nudge.style.includes(filter) || nudge.description.toLowerCase().includes(filter) || nudge.summary.toLowerCase().includes(filter);
    });
  } else {
    console.log('2');
    interventionList = interventionList.slice(0);
  }

  interventionList.sort(function (a, b) {
    return (order[a.level] - order[b.level]) || (a.name < b.name ? -1 : 1);
  });

  interventionList.forEach(function (item) {
    var canIntervene = !ID.interventionDetails[item.id].apps;
    if (!canIntervene) {
      var appList = StorageUtil.getSelectedPackages();
      ID.interventionDetails[item.id].apps.forEach(function (specifiedApp) {
        if (!canIntervene && appList.includes(specifiedApp)) {
          canIntervene = true;
        }
      });
    }
    if (IM.interventions[item.id] && canIntervene) {
      layouts[item.style].addChild(createItem(item));
    }
  });

  Object.keys(layouts).forEach(function(key) {
    if (layouts[key].getChildrenCount()) {
      page.getViewById(key + '-label').visibility = 'visible';
    } else {
      page.getViewById(key + '-label').visibility = 'collapse';
    }
  });
};

var visited = false;
exports.pageLoaded = function(args) {
  events = [{category: "page_visits", index: "nudges_main"}];
  page = args.object;
  layouts['toast'] = page.getViewById("toast-interventions");
  layouts['notification'] = page.getViewById("notification-interventions");
  layouts['dialog'] = page.getViewById("dialog-interventions");
  layouts['overlay'] = page.getViewById("overlay-interventions");
  search = page.getViewById('search-bar');
  drawer = page.getViewById('sideDrawer');
   if (!StorageUtil.isTutorialComplete()) {
    if (!visited) {
      FancyAlert.show(FancyAlert.type.INFO, "Welcome to Nudges!", "This is where your nudges live. Try tapping on one to see what it does!", "Ok");
      visited = true;
    }
    page.getViewById('finish').visibility = 'visible';
    page.getViewById('nudge-scroll').height = '90%';
  }
  setUpList();
};

exports.goToProgress = function() {
  StorageUtil.addLogEvents([{setValue: new Date().toLocaleString(), category: 'navigation', index: 'finished_tutorial'}]);
  StorageUtil.setTutorialComplete();
  fancyAlert.TNSFancyAlert.showSuccess("All set!", "HabitLab can now start helping you create better mobile habits! Just keep using your phone like normal.", "Awesome!");
  frameModule.topmost().navigate({
    moduleName: "views/progressView/progressView",
    context: { 
      fromTutorial: true
    }
  });
};

exports.pageUnloaded = function(args) {
  StorageUtil.addLogEvents(events);
};

exports.layoutUnloaded = function(args) {
  args.object.removeChildren();
};

exports.toggleDrawer = function() {
 if (!StorageUtil.isTutorialComplete()) {
    fancyAlert.TNSFancyAlert.showError("Almost done!", "Click 'Finish Tutorial' to finish setting up HabitLab!", "Got It!");
  } else {
    search.dismissSoftInput();
    events.push({category: "navigation", index: "menu"});
    drawer.toggleDrawerState();
  }
};
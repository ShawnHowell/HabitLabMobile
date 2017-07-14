var application = require("application");
var imageSource = require("image-source");

// expose native APIs 
var Intent = android.content.Intent;
var Calendar = java.util.Calendar;
var System = java.lang.System;
var Context = android.content.Context;
var PackageManager = android.content.pm.PackageManager;

// contexts
var context = application.android.context.getApplicationContext();
var foregroundActivity = application.android.foregroundActivity;

// global information
var pm = context.getPackageManager();	
var mainIntent = new Intent(Intent.ACTION_MAIN, null);
mainIntent.addCategory(Intent.CATEGORY_LAUNCHER);
var applications = pm.queryIntentActivities(mainIntent, 0);
//const DAY_MS = 86400000;


/* getTimeOnAppWeek
 * --------------------
 * Returns array of time (in ms since epoch) that the provided 
 * application has been active over the last 7 days (including 
 * today). Format:
 * 
 *     [7daysAgo, 6daysAgo, 5daysAgo, ..., today]
 *  
 * Populates index with  -1 if there is no usage information 
 * found for that day. Used in month view.
 */
function getTimeOnAppWeek(packageName, weeksAgo) {
	var weeklyUsageStatistics = [];
	for (var i = 6 + 7*weeksAgo; i >= 7*weeksAgo; i--) {
		weeklyUsageStatistics.push(getTimeOnApplicationSingleDay(packageName, i));
	}
	return weeklyUsageStatistics;
}

/* getTimeOnAppThisWeek
 * --------------------
 * Returns the average time spent on an app per week
 */
function getAvgTimeOnAppWeek(packageName, weeksAgo) {
	var week = getTimeOnAppWeek(packageName, weeksAgo);
	var sum = 0;
	var futureDays = 0;
	for (var i = 0; i < week.length; i++) {
		sum += week[i];
		if (week[i] == 0) futureDays++;
	}
	var avg = sum/(week.length-futureDays);
	return Math.round(avg);
}


/* getAvgTimesOnAppMonth
 * -----------------------------
 * Returns an array of the average times that an app is used per week 
 * for a month.
 * e.g. 
 * [3 weeks ago, 2 weeks ago, 1 week ago, 0 weeks ago]
 */
function getAvgTimesOnAppMonth(packageName) {
	var appMonth = [];
	for (var i = 3; i <= 0; i--) {
		appMonth.push(getAvgTimeOnAppWeek(packageName, i));
	}
	return appMonth;
}



/* getTimeOnApplicationSingleDay
 * -----------------------------
 * Returns time (in minutes since epoch) that the provided application
 * has been active. Returns -1 if there is no usage information
 * found.
 */
function getTimeOnApplicationSingleDay(packageName, daysAgo) {
	var startOfTarget = getStartOfDay(daysAgo);
	var endOfTarget = Calendar.getInstance();
	endOfTarget.setTimeInMillis(startOfTarget.getTimeInMillis() + (86400 * 1000));

	var usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE);
    var usageStatsMap  = usageStatsManager.queryAndAggregateUsageStats(startOfTarget.getTimeInMillis(), endOfTarget.getTimeInMillis());

    var stats = usageStatsMap.get(packageName);
    return stats === null ? -1 : Math.round(stats.getTotalTimeInForeground()/60000);
}


/* getTimeOnPhoneSingleDay
 * -----------------------
 * Returns time (in minutes since epoch) that the phone
 * has been active.
 */
function getTimeOnPhoneSingleDay(daysAgo) {
	var totalTimeOnPhone = 0;
	var appsDay = getAppsSingleDay(daysAgo);
	for(var i = 0; i < appsDay.length; i++) {
		totalTimeOnPhone += appsDay[i].mins
	}
    return totalTimeOnPhone;
}


/* getTimeOnPhoneSingleDay
 * -----------------------
 * Helper function, returns a calendar object of the start of a day,
 * provided with the number of days ago 
 */
function getStartOfDay(daysAgo) {
	var startOfTarget = Calendar.getInstance();
	startOfTarget.set(Calendar.HOUR_OF_DAY, 0);
	startOfTarget.set(Calendar.MINUTE, 0);
	startOfTarget.set(Calendar.SECOND, 0);
	startOfTarget.setTimeInMillis(startOfTarget.getTimeInMillis() - (86400 * 1000 * daysAgo));
	return startOfTarget;
};

/* getTimeOnPhoneSingleDay
 * -----------------------
 * Returns the apps used in a single day. Speicifcally returns an array of objects, 
 * where each object is the name of the app and the number of minutes spent on the app today.
 */

function getAppsSingleDay(daysAgo) {
	var start = getStartOfDay(daysAgo);
	var end = Calendar.getInstance();
	end.setTimeInMillis(start.getTimeInMillis() + (86400 * 1000));
	

	var usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE);
    var usageStatsMap  = usageStatsManager.queryAndAggregateUsageStats(start.getTimeInMillis(), end.getTimeInMillis());
    var list = [];

    for (var i = 0; i < applications.size(); i++) {
		var info = applications.get(i);
		var packageName = getPackageName(info); 
		var appUsageStats = usageStatsMap.get(packageName);
		var	appUsage = appUsageStats ? appUsageStats.getTotalTimeInForeground() : 0;
		if (appUsage == 0) continue;

		var name = info.loadLabel(pm).toString();
		if (name === "HabitLabMobile") continue; 
		var mins = Math.round(appUsage/60000);
		var app = new dayApp(name, mins);
		list.push(app);
	}

	return list;
	
};


//Data structure for getAppsSingleDay
function dayApp(name, mins) {
	this.name = name;
	this.mins = mins;
}



/* getTimeOnPhoneWeek
 * ----------------------
 * Returns array of time (in minutes since epoch) that the 
 * phone has been active over the last specified week (including 
 * today). Format:
 * 
 *     [7daysAgo, 6daysAgo, 5daysAgo, ..., today]
 *  
 * Populates index with  -1 if there is no usage information 
 * found for that day.
*/

function getTimeOnPhoneWeek(weeksAgo) {
	var weeklyUsageStatistics = [];
	for (var i = (6 + 7*weeksAgo); i >= 7*weeksAgo; i--) {
		weeklyUsageStatistics.push(getTimeOnPhoneSingleDay(i));
	}
	return weeklyUsageStatistics;
}



/* getAvgTimeOnPhoneThisMonth
 * ----------------------
 * Returns array of average time per week (in minutes since epoch) that the 
 * phone has been active over the last month (including 
 * today). Format:
 * 
 *     [3 weeks ago, 2 weeks ago, 1 weeks ago, 0 week ago]
 *  
 * Populates index with  -1 if there is no usage information 
 * found for that day.
 */

function getAvgTimeOnPhoneThisMonth() {
	var monthlyUsage = [];
	var week3 = getTimeOnPhoneSingleDay(17)/7;
	var week4 = getTimeOnPhoneSingleDay(24)/7;
	monthlyUsage.push(week4);
	monthlyUsage.push(week3);
	for (var i = 1; i >= 0; i--) {
		monthlyUsage.push(getAvgTimeOnPhoneWeek(i));
	}
	return monthlyUsage;
}




/* getAvgTimeOnPhoneWeek
 * ----------------------
 * Returns the average amount of time spent on phone this week.
 * If the week is halfway through e.g. wednesday, will return the 
 * average time spent on phone per day for Monday and Tuesday
 */

function getAvgTimeOnPhoneWeek(weeksAgo) {
	var week = getTimeOnPhoneWeek(weeksAgo);
	var sum = 0;
	var futureDays = 0;
	for (var i = 0; i < week.length; i++) {
		sum += week[i];
		if (week[i] == 0) futureDays++;
	}
	var avg = sum/(week.length-futureDays);
	return Math.round(avg);
}


/* getApplicationList
 * ------------------
 * Returns list of objects containing following fields: 
 * 
 *     packageName: package name,
 *     label: application label,
 *     iconSource: icon bitmap that can be assigned to <Image> src field,
 *     averageUsage: average usage over last 4 weeks or since installation,
 *     
 * for every application in the system.
 */
function getApplicationList() {
 	// 4 weeks ago
	var startOfTarget = getStartOfDay(27);

 	var usageStatsManager = context.getSystemService(Context.USAGE_STATS_SERVICE);
    var usageStatsMap  = usageStatsManager.queryAndAggregateUsageStats(startOfTarget.getTimeInMillis(), System.currentTimeMillis());

    // construct list
	var list = [];
	for (var i = 0; i < applications.size(); i++) {
		var info = applications.get(i);
		var packageName = getPackageName(info);
		var label = info.loadLabel(pm).toString();
		var iconSource = imageSource.fromNativeSource(info.loadIcon(pm).getBitmap());
		var averageUsage = getAverageUsage(usageStatsMap, packageName, getInstallationTime(packageName));

		// construct object
		var applicationObj = {
			packageName: packageName,
			label: label, 
			iconSource: iconSource, 
			averageUsage: averageUsage
		};

		list.push(applicationObj);
	}
	return list;
};


/*
 * getAppName
 * --------------
 * Returns the application name of the passed-in packageName.
 * Returns "(unknown)" if there is no packageName.
 */
function getAppName(packageName) {
	info = getInfo(packageName);
	var appName = (info != null ? pm.getApplicationLabel(info) : "(unknown)");
	return appName;
}


/*
 * getInfo
 * --------------
 * Returns the icon source when given a packageName. 
 * If no icon available, returns null.
 */

function getIcon(packageName) {
	info = getInfo(packageName);
	var iconSource = (info != null ? imageSource.fromNativeSource(info.loadIcon(pm).getBitmap()) : "~/logo.png");
	return iconSource;
}


/*
 * getInfo
 * --------------
 * Helper function that returns the resolveInfo when given a package name. 
 * If no info available, returns null.
 */

function getInfo(packageName) {
	var info = null;
	try {
		info = pm.getApplicationInfo(packageName, 0);
	} catch (err) {
		info = null;
	}
	return info;
}



/*
 * getPackageName
 * --------------
 * Returns the package name of the passed-in ResolveInfo
 * object. Returns null if there is no packageName.
 */
 function getPackageName(info) {
	if (info.activityInfo) {
		return info.activityInfo.packageName;
	} else if (info.serviceInfo) {
		return info.serviceInfo.packageName;
	} else if (info.providerInfo) {
		return info.providerInfo.packageName;
	} else {
		return null;
	}
}

/*
 * getInstallationTime
 * -------------------
 * Returns the first install date of the passed-in
 * package.
 */
 function getInstallationTime(packageName) {
	try {
        return pm.getPackageInfo(packageName, 0).firstInstallTime;
    } catch (error) {
        return null;
    }
 }

 /*
 * getAverageUsage
 * ---------------
 * Takes in a UsageStats map, a packageName, and the installation
 * time of the provided package and returns the amount of time (on
 * average) the package is used. Averages over last 4 weeks, or since 
 * installation time if the package was installed less than 4 weeks ago/
 */
function getAverageUsage(map, pkg, installTime) {
    var stats = map.get(pkg);
    if (stats) {
    	var days;
    	if (stats.getFirstTimeStamp() < installTime) {
    		days = Math.ceil((System.currentTimeMillis() - installTime) * 1000 * 60 * 60 * 24);
    	} else {
    		days = 28;
    	} 
    	return stats.getTotalTimeInForeground() / days;
    } else {
    	return null;
    }

    var averages = [];

    for (var i = 0; i < packageNames.length; i++) {
    	var name = packageNames[i];
    	var stats = usageStatsMap.get(name);
    	if (stats) {
    		averages.push(stats.getTotalTimeInForeground() / 28);
    	} else {
    		averages.push(-1);
    	}
    }

    return averages;
}



module.exports = {getApplicationList: getApplicationList, 
	getTimeOnApplicationSingleDay: getTimeOnApplicationSingleDay, 
	getTimeOnPhoneWeek : getTimeOnPhoneWeek, 
	getTimeOnPhoneSingleDay : getTimeOnPhoneSingleDay, 
	getTimeOnAppWeek : getTimeOnAppWeek,
	getAppName : getAppName,
	getIcon : getIcon,
	getAppsSingleDay : getAppsSingleDay,
	getAvgTimeOnPhoneWeek : getAvgTimeOnPhoneWeek,
	getAvgTimeOnAppWeek : getAvgTimeOnAppWeek, 
	getAvgTimeOnPhoneThisMonth : getAvgTimeOnPhoneThisMonth, 
	getAvgTimesOnAppMonth : getAvgTimesOnAppMonth};




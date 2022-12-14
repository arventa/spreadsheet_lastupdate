/*
Create schedule for every day at hours : minutes
*/
function create_schedule(hours,minutes) {

  ScriptApp.newTrigger('emailOnFileActivities')
    .timeBased()
    .everyDays(1)
    .atHour(hours).nearMinute(minutes)
    .create();
  Logger.log('New Trigger successfully created');

}


/*
Delete all Schedule
*/
function delete_schedule() {
  var allTriggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < allTriggers.length; ++i) {
    ScriptApp.deleteTrigger(allTriggers[i]);
  }
  Logger.log('All Schedules were deleted');
}



function emailOnFileActivities(fileID,emailAddress,accountId) {
  
  // set x hours time period - as we only want updates in the last x hours
  hours=24
  var xHours = (hours * 60) * 60 * 1000;  // convert to milliseconds
  
  // get current date/time
  var currentDateTime = new Date();
  // create empty array to push any file changes into later
  var editList = [];
  var last24 = currentDateTime-xHours
  
  var qry = "{\"item_name\": \"items/"
  var qry1 ="\"pageSize\": 100," 
  var qry2 = "\"filter\": \"time>"
  var qry4 = "\"pageToken\":\""
  var rslt=qry.concat(fileID,"\",",qry1,qry2,last24,"\",")
  Logger.log(rslt.concat(qry4,"\"}"));
    
    activities = DriveActivity.Activity.query(rslt.concat(qry4,"\"}")) //query to Drive activity https://developers.google.com/drive/activity/v2/reference/rest/v2/activity/query

    // get all activity items (array returned)
    var detailActivity = activities.activities;

  do{
    // check if there are revisions before proceeding - otherwise no changes have been made
    if (detailActivity.length > 0) {

      // yes there are revisions so loop through each one in turn **********************************
      for (var i = 0; i < activities.activities.length; i++) {
        // extract single activity for file to work with
        var activity = detailActivity[i];
        
        // date/time last modification was made
        var modifiedDate = new Date(activity.timestamp);
        Logger.log(modifiedDate);
        var gap=currentDateTime-modifiedDate;
        


        // check if modified date within our given time period, otherwise ignore **********************
        if (gap < xHours) {

          // get email of last modifier
          var lastModifierUsername = activity.actors[0].user.knownUser.personName;
          if (lastModifierUsername=='people/'+accountId){
            var accountID='people/'+lastModifierUsername;
            var people_detail=People.People.get(accountID,{personFields:'EmailAddresses'});
            var people_email=people_detail.emailAddresses[0].value
            // push items into empty array
           editList.push([modifiedDate, people_email]);
          }
        }
        else {
          // modified date is older than our given time period
        }
      
        // check if modified date within our given time period, otherwise ignore **********************


      }
      // yes there are revisions so loop through each one in turn **********************************


    }
    else {
    //Logger.log(revisions);
    }
    
    if (activity.nextPageToken){
      activities = DriveActivity.Activity.query(rslt.concat(qry4,revision.nextPageToken,"\"}"))
    }
    // get all activities in next page, if any
    var detailActivity = activities.activities;
  }while (activities.nextPageToken)

  // create email for sending if there's no update in 24 hours *********************************
  if (!editList.length) {
    // there are revisions to be emailed
    // get File Url for linking in email
    var fileUrl = DriveApp.getFileById(fileID).getUrl();
    var fileName =DriveApp.getFileById(fileID).getName();

    // create Email subject
    var emailSubject = 'File '+fileName+' not updated yet';

    // create Email body *************************************
    var body = "Hi" + "\n\n";
    body += "File is not updated in last " + hours + " hours." + "\n\n";
    body += "Link to file: " + fileUrl + "\n\n";
    body += "Please check it"

    body += "Thank you";
    // create Email body *************************************

    // send the Email
    MailApp.sendEmail(emailAddress, emailSubject, body);

  } // create email for sending if there's no update in 3 hours *********************************
  else {
    var lasthour=(3 * 60) * 60 * 1000;
    var lastest=editList[0]
    Logger.log(lastest)
    if ((currentDateTime-lastest[0])>lasthour) {

      
      var fileUrl = DriveApp.getFileById(fileID).getUrl();
      var fileName =DriveApp.getFileById(fileID).getName();
      var emailSubject = 'File '+fileName+' not updated yet';
      var body = "Hi" + "\n\n";
      body += "File is not updated since " + lastest[0];
      body += "Link to file: " + fileUrl + "\n\n";
      body += "Please check it"
      body += "Thank you";
      MailApp.sendEmail(emailAddress, emailSubject, body);
    }
  }
  // create email for sending with latest File revisions *********************************

}

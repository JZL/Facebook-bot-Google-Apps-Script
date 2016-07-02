/*SETTING UP:
follow https://developers.facebook.com/docs/messenger-platform/quickstart but to get your webhook URL:
     go to the cloud icon (5th from the left) and make sure at the bottom "Who has access to the app:" = "Anyone, even anonymous", then press "DEPLOY" and use the resulting url
*/
//MAKE SURE EACH TIME UPDATE: GO TO THE CLOUD ICON (5th icon from the left), click "Project Version"->"New" and click the Update Button


var DEBUG = true
//used to debug, will add to this instead of Logger.log (can't bc is being triggered outside the normal GAS runtime)
var SPREADSHEET_ID = "PUT_SPREADHSEET_ID_HERE (make new spreadsheet and is part after "/d")"
var ACCESS_TOKEN = "PUT_ACCESS_TOKEN_HERE"


function log(subject, body){
//  MailApp.sendEmail("jonahmail1@gmail.com", subject, body)
  if(DEBUG){
    SpreadsheetApp.openById(SPREADSHEET_ID).appendRow([subject, body])
  }
}

function doGet(request) {
  //this is for renewing the webhook
//  https://developers.facebook.com/apps/863668370411029/messenger/
  //
  log("gotrequest", JSON.stringify(request)) 
  //  log("gotrequest", request.parameters["hub.challenge"][0]) 
  if(request.parameters["hub.verify_token"] == "is_password"){
    log("gotVerify", "")
    return ContentService.createTextOutput(request.parameters["hub.challenge"][0]);
  }
  return ContentService.createTextOutput("");
}

function doPost(request){
  try{
    log("gotrequest", request.postData.contents)
    //  return ContentService.createTextOutput("NOT RIGHT TOKEN");
    
    var data = JSON.parse(request.postData.contents)//.contents;
    log(data.object, "")
    
    // Make sure this is a page subscription
    if (data.object == 'page') {
      // Iterate over each entry
      // There may be multiple if batched
      data.entry.forEach(function(pageEntry) {
        var pageID = pageEntry.id;
        var timeOfEvent = pageEntry.time;
        
        // Iterate over each messaging event
        pageEntry.messaging.forEach(function(messagingEvent) {
          if (messagingEvent.optin) {
            //todo but shoukd only be if public: https://developers.facebook.com/docs/messenger-platform/plugin-reference/send-to-messenger
            //receivedAuthentication(messagingEvent);
          } else if (messagingEvent.message) {
            log("got message", JSON.stringify(messagingEvent))
            receivedMessage(messagingEvent);
          } else if (messagingEvent.delivery) {
            log("got delivery confirmait+on", JSON.stringify(messagingEvent))
//            receivedDeliveryConfirmation(messagingEvent);
          } else if (messagingEvent.postback) {
            log("got postback", JSON.stringify(messagingEvent))
            receivedPostback(messagingEvent);
          } else {
            //also hook on account_linking but not doing anything
            log("Webhook received unknown messagingEvent: ", JSON.stringify(messagingEvent));
          }
        });
      });
      return ContentService.createTextOutput("ALL GOOD");
    }else{
      log("dataObject not page", "")
    }
  }catch(e){
    log("error", e)
    
  }
}

function test(){
//  sendTextMessage("1359249650767661", "hellop")
  sendGenericMessage("1359249650767661")
}


function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  
//  Logger.log("Received message for user %d and page %d at %d with message:", 
//              senderID, recipientID, timeOfMessage);
  log("Received message for user "+senderID+" and page "+recipientID+" at "+timeOfMessage+" with message:"+message)
//  Logger.log(JSON.stringify(message));
  
  var messageId = message.mid;
  
  // You may get a text or attachment but not both
  var messageText = message.text;
  var messageAttachments = message.attachments;
  
  if (messageText) {
    
    // If we receive a text message, check to see if it matches any special
    // keywords and send back the corresponding example. Otherwise, just echo
    // the text we received.
    switch (messageText) {
      case 'image':
        sendImageMessage(senderID);
        break;
        
      case 'button':
        sendButtonMessage(senderID);
        break;
        
      case 'generic':
        sendGenericMessage(senderID);
        break;
       
      case 'receipt':
        sendReceiptMessage(senderID);
        break;
      case 'pick':
        sendPick(senderID)
        break;
      case 'airport':
        sendAirline(senderID);
        break;
      default:
        sendTextMessage(senderID, messageText);
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "rift",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for first bubble",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
          }]
        }
      }
    }
  };  
  
  callSendAPI(messageData);
}

function sendPick(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
   "message":{
    "text":"Pick a color:",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Red",
        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED"
      },
      {
        "content_type":"text",
        "title":"Green",
        "payload":"DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN"
      }
    ]
  }
  };  
  
  callSendAPI(messageData);
}

function sendAirline(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    "message": {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "airline_itinerary",
          "intro_message": "Here\'s your flight itinerary.",
          "locale": "en_US",
          "pnr_number": "ABCDEF",
          "passenger_info": [
            {
              "name": "Farbound Smith Jr",
              "ticket_number": "0741234567890",
              "passenger_id": "p001"
            },
            {
              "name": "Nick Jones",
              "ticket_number": "0741234567891",
              "passenger_id": "p002"
            }
          ],
          "flight_info": [
            {
              "connection_id": "c001",
              "segment_id": "s001",
              "flight_number": "KL9123",
              "aircraft_type": "Boeing 737",
              "departure_airport": {
                "airport_code": "SFO",
                "city": "San Francisco",
                "terminal": "T4",
                "gate": "G8"
              },
              "arrival_airport": {
                "airport_code": "SLC",
                "city": "Salt Lake City",
                "terminal": "T4",
                "gate": "G8"
              },
              "flight_schedule": {
                "departure_time": "2016-01-02T19:45",
                "arrival_time": "2016-01-02T21:20"
              },
              "travel_class": "business"
            },
            {
              "connection_id": "c002",
              "segment_id": "s002",
              "flight_number": "KL321",
              "aircraft_type": "Boeing 747-200",
              "travel_class": "business",
              "departure_airport": {
                "airport_code": "SLC",
                "city": "Salt Lake City",
                "terminal": "T1",
                "gate": "G33"
              },
              "arrival_airport": {
                "airport_code": "AMS",
                "city": "Amsterdam",
                "terminal": "T1",
                "gate": "G33"
              },
              "flight_schedule": {
                "departure_time": "2016-01-02T22:45",
                "arrival_time": "2016-01-03T17:20"
              }
            }
          ],
          "passenger_segment_info": [
            {
              "segment_id": "s001",
              "passenger_id": "p001",
              "seat": "12A",
              "seat_type": "Business"
            },
            {
              "segment_id": "s001",
              "passenger_id": "p002",
              "seat": "12B",
              "seat_type": "Business"
            },
            {
              "segment_id": "s002",
              "passenger_id": "p001",
              "seat": "73A",
              "seat_type": "World Business",
              "product_info": [
                {
                  "title": "Lounge",
                  "value": "Complimentary lounge access"
                },
                {
                  "title": "Baggage",
                  "value": "1 extra bag 50lbs"
                }
              ]
            },
            {
              "segment_id": "s002",
              "passenger_id": "p002",
              "seat": "73B",
              "seat_type": "World Business",
              "product_info": [
                {
                  "title": "Lounge",
                  "value": "Complimentary lounge access"
                },
                {
                  "title": "Baggage",
                  "value": "1 extra bag 50lbs"
                }
              ]
            }
          ],
          "price_info": [
            {
              "title": "Fuel surcharge",
              "amount": "1597",
              "currency": "USD"
            }
          ],
          "base_price": "12206",
          "tax": "200",
          "total_price": "14003",
          "currency": "USD"
        }
      }
    }
  };  
  
  callSendAPI(messageData);
}


function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}


function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

//  console.log("Received postback for user %d and page %d with payload '%s' " + 
//    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}


function callSendAPI(messageData) {
  var JSONdMessageData = {}
  for(var i in messageData){
    JSONdMessageData[i] = JSON.stringify(messageData[i])
  }
  payload = JSONdMessageData
  payload.access_token = ACCESS_TOKEN
  
  var options =
      {
        "method" : "post",
        "payload" : payload,      
      };
  UrlFetchApp.fetch("https://graph.facebook.com/v2.6/me/messages", options);  
}
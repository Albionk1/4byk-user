const admin = require('firebase-admin');

// Initialize the app with your Firebase project credentials
exports.initializeApp = () => {
  try{
    var serviceAccount = require("../4buyk-firebase.json"); 
    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    });
  } catch(e){
    console.log(e)
  }
     
}

// Define the registration token for the device you want to send the notification to
// const registrationToken = 'dUpwTSKLQSCThXE1MQxFUv:APA91bHxEIbpwKC0ybVIkdge1r-GRVO-UmiQJUIAIkh8Zx2RVzo5xhEMLizqfcPKSUWjYqvTRMYAXKByZzno42fHQl_CY9Y1dlTwXBl3eHK3K4UIC7Q9fz8j9-7ueKuSR1tWxfpGEnPm';
// const registrationToken = 'clEHaSt5SfGziwDfqJRQF-:APA91bGBAsyGrESrYv7Z-diRD9zWf7UTAXrOc_lHfJ6zpmUBV16kJ2bsGIYOM9IXSAyAmLYEQiMaXKhPd8TNgSDVsU4e_G_bU2NtIUsZPli0FEMzJNQMlJLflGbDlG19bv_P493hOy1k';

exports.sendMessage =  (title, body,token) => { 
  try{
  const data = {
   
    body: JSON.stringify(body),  // You can also include the entire object as a string if needed
  }
const message = {
    notification: {
      title ,
      body:body.message,
      // payload:JSON.stringify(body)

    },
    data,
    token,
  };
  
  // Send the message using the Firebase Cloud Messaging API
  admin.messaging().send(message)
    .then((response) => {
        console.log('Successfully sent message:',   title, body);    
    })
    .catch((error) => {
      // Queuing...
      console.log(error)
      console.error('Token i perdoruesit nuk ekziston');
 
    });
  }
  catch(e){
    console.log(e)
    console.log('Ky error nuk e ban crash se o handle')
  }
}


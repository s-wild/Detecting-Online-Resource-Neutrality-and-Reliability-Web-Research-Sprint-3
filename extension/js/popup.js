/*
* Popup.js
* This file is called when the chrome extension has been called loaded.
* A URL is retrived from current chrome tab and the results from the
* server will be displayed.
*/
window.onload = function(){
  // Performance timer
  start_time = new Date().getTime();

  /*
  * Hide results on load, wait for a response from the server and show
  * activityIndicator.
  */
  chromeExtensionDisplay.hideResults();
  activityIndicator();

  (function () {
    // Chrome API to get url.
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){

        // Get URL in current tab.
        var currentProtocolURL = tabs[0].url;

        // Combine server URL (settings.js) with chrome tab URL.
        var url = server_url + 'api';

        // If no response, assign no value.
        responseValues = "na";

        // Check if user is on a new tab, prevent application if so.
        if (currentProtocolURL == "chrome://newtab/") {
          messages.errorMessageNoUrl();
        }
        else {
          var data = {"url": currentProtocolURL};

          // POST request.
          var xmlhttp = new XMLHttpRequest();
          xmlhttp.onreadystatechange = function() {
              if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                  // Parse JSON from URL... May need updating when we return JSON instead of text.
                  const responseValues = JSON.parse(xmlhttp.responseText);
                  console.log("responseValues",responseValues);
                  var sentimentValue = responseValues.alchemy.sentiment;
                  var spellingValue = responseValues.spelling;
                  var emotionType = responseValues.alchemy.emotion.highest;
                  var emotionValue = responseValues.alchemy.emotion.value;
                  var entitiesObejct = responseValues.alchemy.entities;
                  var weaselValues = responseValues.warnings[0];
                  var reliabilityValue = responseValues.reliability;

                  // Show results in extension display.
                  chromeExtensionDisplay.showResults();

                  // Generate display functions.
                  //generate.gauge(sentimentValue, "sentiment");
                  //generate.spellingRating(spellingValue);
                  //generate.emoji(emotionType, emotionValue);
                  //generate.weaselWords(weaselValues);
                  //generate.reliability(reliabilityValue);
                  //generate.entitiesList(entitiesObejct);

                  // Response time.
                  var request_time = new Date().getTime() - start_time;
                  //document.getElementById("responseTime").innerHTML = request_time;
              }
              else {
                messages.connectionError();
              }
          };
          xmlhttp.open("POST", url, true);
          xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          xmlhttp.send(JSON.stringify(data));
          return responseValues;
        }
    });
  })();
};

/*
* Chrome Extension Display
*/
chromeExtensionDisplay = {
    hideResults: function() {
        document.getElementById("results").style.display = 'none';
    },
    showResults: function() {
      document.getElementById("results").style.display = 'block';
      document.getElementById("spinner").style.display = 'none';
    }
};
/*
* Error Messages
*/
messages = {
    connectionError: function() {
        document.getElementById("results").innerHTML = "<p>Problems connecting with server...</p>";
    },
    noURLError: function() {
      document.getElementById("results").innerHTML = "<p>Please visit a web page...</p>";
    }
};
/*
* Actiivity loader.
*/
function activityIndicator() {
  var opts = {
    lines: 13, // The number of lines to draw
    length: 14, // The length of each line
    width: 3, // The line thickness
    radius: 11, // The radius of the inner circle
    scale: 1, // Scales overall size of the spinner
    corners: 1, // Corner roundness (0..1)
    color: '#000', // #rgb or #rrggbb or array of colors
    opacity: 0.25, // Opacity of the lines
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    fps: 20, // Frames per second when using setTimeout() as a fallback for CSS
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    className: 'spinner', // The CSS class to assign to the spinner
    top: '70%', // Top position relative to parent
    left: '50%', // Left position relative to parent
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    position: 'absolute', // Element positioning
  };
  var target = document.getElementById('spinner');
  var spinner = new Spinner(opts).spin(target);
}
/*
* This group of functions generates selected results in the extension display.
*/
generate = {
    gauge: function(value, type) {
      // Check values and set text for sentiment.
      if (type == "sentiment") {
        // Set text response based from values.
        switch(true) {
            case value > 70:
                console.log("Positive");
                //document.getElementById("sentimentText").innerHTML = "Positive";
                break;
            case value <= 70 && value > 50 :
                console.log("Neutral/Positive");
                document.getElementById("sentimentText").innerHTML = "Neutral/Positive";
                break;
            case value == 50:
                console.log("Neutral");
                document.getElementById("sentimentText").innerHTML = "Neutral";
                break;
            case value < 50 && value >= 30 :
                console.log("Neutral/Negative");
                document.getElementById("sentimentText").innerHTML = "Neutral/Negative";
                break;
            case value < 30:
                console.log("Negative");
                document.getElementById("sentimentText").innerHTML = "Negative";
                break;
            default:
                console.log("Can't calculate value.");
        }
      }
      // Set options for gauge.
      var opts = {
        lines: 12, // The number of lines to draw
        angle: 0.15, // The length of each line
        lineWidth: 0.44, // The line thickness
        pointer: {
          length: 0.9, // The radius of the inner circle
          strokeWidth: 0.035, // The rotation offset
          color: '#000000' // Fill color
        },
        limitMax: 'false',   // If true, the pointer will not go past the end of the gauge
        //colorStart: 'red',   // Colors
        colorStop: 'green',    // just experiment with them
        strokeColor: 'red',   // to see which ones work best for you
        generateGradient: false,
      };
      console.log(type);
      // Check type for gauge
      switch(type) {
          case "sentiment":
              var target = document.getElementById('sentiment');
              console.log("sentiment");
              break;
          case "reliability":
              var target = document.getElementById('reliabilityGauge');
              console.log("reliability");
              reliabilityValue = value;
              break;
          default:
              target = "na";
      }

      // Set values to canvas.
      if (target != "na") {
        var gauge = new Gauge(target).setOptions(opts); // create sexy gauge!
        gauge.maxValue = 100; // set max gauge value
        gauge.animationSpeed = 5; // set animation speed (32 is default value)
        gauge.set(value); // set actual value
      }
    },
    spellingRating: function(spellingValue) {
      var starValue = (parseInt(spellingValue))/20;
      var starValueRounded = starValue.toFixed(0);
      $('#example').barrating({
        theme: 'fontawesome-stars'
      });
      $('#example').barrating('set', starValueRounded);
      if(starValueRounded == 5) {
          document.getElementById("langRating").innerHTML = 'Exceptional';
      }
      if(starValueRounded == 4) {
          document.getElementById("langRating").innerHTML = 'Good';
      }
      if(starValueRounded == 3) {
          document.getElementById("langRating").innerHTML = 'Average';
      }
      if(starValueRounded == 2) {
          document.getElementById("langRating").innerHTML = 'Poor';
      }
      if(starValueRounded == 1) {
          document.getElementById("langRating").innerHTML = 'Terrible';
      }
    },
    emoji: function(emotionType, emotionValue) {
      switch(emotionType) {
        case "joy":
          document.getElementById("emotion").innerHTML = '<img src="images/joy.png" alt="Emoji Icon">';
          document.getElementById("emotionText").innerHTML = 'Joy';
        break;
        case "disgust":
          document.getElementById("emotionText").innerHTML = 'Disgust';
          document.getElementById("emotion").innerHTML = '<img src="images/disgust.png" alt="Emoji Icon">';
        break;
        case "anger":
          document.getElementById("emotionText").innerHTML = 'Anger';
          document.getElementById("emotion").innerHTML = '<img src="images/angry.png" alt="Emoji Icon">';
        break;
        case "fear":
          document.getElementById("emotionText").innerHTML = 'Fear';
          document.getElementById("emotion").innerHTML = '<img src="images/fear.png" alt="Emoji Icon">';
        break;
        case "sadness":
          document.getElementById("emotionText").innerHTML = 'Sadness';
          document.getElementById("emotion").innerHTML = '<img src="images/sadness.png" alt="Emoji Icon">';
        break;
        default:
            console.log("no match...");
      }
    },
    weaselWords: function(weaselValues) {
      // Check if undefined.
      if (weaselValues === undefined) {
        weaselValues = "Nothing bad to say... the article looks fine.";
      }
      document.getElementById("weaselValue").innerHTML = weaselValues;
    },
    reliability: function(reliabilityValue) {
      document.getElementById("reliabilityValue").innerHTML = reliabilityValue + "%";
      generate.gauge(reliabilityValue, "reliability");
    },
    entitiesList: function(entitiesObejct) {
      // Loop through objects, detect type.
      for (var key in entitiesObejct) {
        // skip loop if the property is from prototype
        if (!entitiesObejct.hasOwnProperty(key)) continue;

        var obj = entitiesObejct[key];
        var entityType = obj.type;
        var entityValue = obj.text;
        var entityURL = "na";
        if (obj.disambiguated) {
          var entityDisambiguated = obj.disambiguated;
          entityURL = entityDisambiguated.website
        }

         // Check if organisation.
         if (entityType === "Organization") {
           if (entityURL != "na") {
             $( "#actors" ).append( '<a href="' + entityURL + '" target="_blank">' +
             '<div class="btn"><i class="fa fa-university"></i> ' +
             entityValue + '</div></a>');
           } else {
             $( "#actors" ).append('<div class="btn"><i class="fa fa-university"></i> ' +
             entityValue + '</div>');
           }

         }
         // Check if person.
         else if (entityType === "Person") {
           // Check if URL exists.
           if (entityURL != "na") {
             $( "#actors" ).append( '<a href="' + entityURL + '" target="_blank">' +
             '<div class="btn"><i class="fa fa-user"></i> ' +
             entityValue + '</div></a>');
           } else {
             $( "#actors" ).append('<div class="btn"><i class="fa fa-user"></i> ' +
             entityValue + '</div>');
           }
         }
         // Check if Country.
         else if (entityType === "Country") {
          // Check URL exists.
          if (entityURL != "na") {
             $( "#actors" ).append( '<a href="' + entityURL + '" target="_blank">' +
             '<div class="btn"><i class="fa fa-globe"></i> ' +
             entityValue + '</div></a>');
           } else {
             $( "#actors" ).append('<div class="btn"><i class="fa fa-globe"></i> ' +
             entityValue + '</div>');
           }
         }
         // Check if job title
         else if (entityType === "JobTitle") {
           // Check if URL exists.
           if (entityURL != "na") {
              $( "#actors" ).append( '<a href="' + entityURL + '" target="_blank">' +
              '<div class="btn"><i class="fa fa-briefcase"></i> ' +
              entityValue + '</div></a>');
            } else {
              $( "#actors" ).append('<div class="btn"><i class="fa fa-briefcase"></i> ' +
              entityValue + '</div>');
            }
         }
         // Check if job title
         else if (entityType === "Company") {
           // Check if URL exists.
           if (entityURL != "na") {
              $( "#actors" ).append( '<a href="' + entityURL + '" target="_blank">' +
              '<div class="btn"><i class="fa fa-building"></i> ' +
              entityValue + '</div></a>');
            } else {
              $( "#actors" ).append('<div class="btn"><i class="fa fa-building"></i> ' +
              entityValue + '</div>');
            }
         }
         // If no match, append question mark icon.
         else {
           // Check if URL exists.
           if (entityURL != "na") {
              $( "#actors" ).append( '<a href="' + entityURL + '" target="_blank">' +
              '<div class="btn"><i class="fa fa-question"></i> ' +
              entityValue + '</div></a>');
            } else {
              $( "#actors" ).append('<div class="btn"><i class="fa fa-question"></i> ' +
              entityValue + '</div>');
            }
         }
       }
    }
};

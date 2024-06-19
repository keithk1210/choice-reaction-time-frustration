/**
 * jspsych plugin for categorization trials with feedback
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 * 
 * Modified by Ian Eisenberg to record more trial parameters
 **/


jsPsych.plugins["poldrack-categorize"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('animation', 'stimulus', 'image');

  plugin.trial = function(display_element, trial) {

    console.log("poldrack-categorize")
    // for (elem in display_element) {
    //   if (elem == '0') {
    //     console.log(display_element[elem])
    //     display_element[elem].classList.add('trial-container')
    //   }
    // }
    var trialContainerDiv = document.createElement('div');
    trialContainerDiv.className = 'trial-container';

  
    // default parameters
    trial.text_answer = (typeof trial.text_answer === 'undefined') ? "" : trial.text_answer;
    trial.correct_text = (typeof trial.correct_text === 'undefined') ? "<p class='feedback'>Correct</p>" : trial.correct_text;
    trial.incorrect_text = (typeof trial.incorrect_text === 'undefined') ? "<p class='feedback'>Incorrect</p>" : trial.incorrect_text;
    trial.show_stim_with_feedback = (typeof trial.show_stim_with_feedback === 'undefined') ? true : trial.show_stim_with_feedback;
    trial.is_html = (typeof trial.is_html === 'undefined') ? false : trial.is_html;
    trial.force_correct_button_press = (typeof trial.force_correct_button_press === 'undefined') ? false : trial.force_correct_button_press;
    trial.prompt = (typeof trial.prompt === 'undefined') ? '' : trial.prompt;
    trial.show_feedback_on_timeout = (typeof trial.show_feedback_on_timeout === 'undefined') ? false : trial.show_feedback_on_timeout;
    trial.timeout_message = trial.timeout_message || "<p>Please respond faster.</p>";
    // timing params
    trial.response_ends_trial = (typeof trial.response_ends_trial == 'undefined') ? false : trial.response_ends_trial;
    trial.timing_stim = trial.timing_stim || -1; // default is to show image until response
    trial.timing_response = trial.timing_response || -1; // default is no max response time
    trial.timing_feedback_duration = trial.timing_feedback_duration || 2000;
    trial.timing_post_trial = (typeof trial.timing_post_trial === 'undefined') ? 1000 : trial.timing_post_trial;

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // this array holds handlers from setTimeout calls
    // that need to be cleared if the trial ends early
    var setTimeoutHandlers = [];

    if (!trial.is_html) {
      // add image to display
      var imgElement = document.createElement('img');
      imgElement.src = trial.stimulus;
      imgElement.className = 'jspsych-poldrack-categorize-stimulus';
      imgElement.id = 'jspsych-poldrack-categorize-stimulus';
      trialContainerDiv.appendChild(imgElement)
    } else {
      var divElement = document.createElement('div');
      divElement.id = 'jspsych-poldrack-categorize-stimulus';
      divElement.className = 'jspsych-poldrack-categorize-stimulus';
      divElement.innerHTML = trial.stimulus;
      trialContainerDiv.appendChild(divElement)
    }

    // hide image after time if the timing parameter is set
    if (trial.timing_stim > 0) {
      setTimeoutHandlers.push(setTimeout(function() {
        $('#jspsych-poldrack-categorize-stimulus').css('visibility', 'hidden');
      }, trial.timing_stim));
    }

    // if prompt is set, show prompt
    if (trial.prompt !== "") {
      display_element.append(trial.prompt);
    }

        // add buttons for responses

    // Create the button container div
    var btnContainer = document.createElement('div');
    btnContainer.id = 'btn-container';

    // Create the first button
    var button1 = document.createElement('button');
    button1.id = 'button-1';
    button1.className = 'jspsych-btn';
    button1.textContent = 'Orange';

    // Create the second button
    var button2 = document.createElement('button');
    button2.id = 'button-2';
    button2.className = 'jspsych-btn';
    button2.textContent = 'Blue';

    // Append buttons to the button container
    btnContainer.appendChild(button1);
    btnContainer.appendChild(button2);

    // Append the button container to the trial container
    trialContainerDiv.appendChild(btnContainer);

    display_element['0'].appendChild(trialContainerDiv)

    console.log(display_element['0'].innerHTML)


    var trial_data = {};

    // create response function
    var after_response = function(info) {

      // after a valid response, the stimulus will have the CSS class 'responded'
      // which can be used to provide visual feedback that a response was recorded
      $("#jspsych-poldrack-categorize-stimulus").addClass('responded');

      // kill any remaining setTimeout handlers
      for (var i = 0; i < setTimeoutHandlers.length; i++) {
        clearTimeout(setTimeoutHandlers[i]);
      }

       // clear button listeners

       $('#button-1').off('click');

       $('#button-2').off('click');
      var correct = false;
      if (trial.key_answer == info.key) {
        correct = true;
      }

      //calculate stim and block duration
      var stim_duration = trial.timing_stim
      var block_duration = trial.timing_response
      if (trial.response_ends_trial & info.rt != -1) {
          block_duration = info.rt
      }
      if (stim_duration != -1) {
        stim_duration = Math.min(block_duration,trial.timing_stim)
      } else {
        stim_duration = block_duration
      }

      // save data
      trial_data = {
        "rt": info.rt,
        "correct": correct,
        "stimulus": trial.stimulus,
        "key_press": info.key,
        "correct_response": trial.key_answer,
        "possible_responses": trial.choices,
        "stim_duration": stim_duration,
        "block_duration": block_duration,
        "feedback_duration": trial.timing_feedback_duration,
        "timing_post_trial": trial.timing_post_trial
      };


      var timeout = info.rt == -1;

      // if response ends trial display feedback immediately
      if (trial.response_ends_trial || info.rt == -1) {
        display_element.html('');
        doFeedback(correct, timeout);
      // otherwise wait until timing_response is reached
      } else {
        if (info.key === trial.key_answer) {
            correct = true
        } else {

          correct = false

        }

        if (trial.timing_stim > -1) {
          setTimeout(function() {
            $('#jspsych-poldrack-categorize-stimulus').css('visibility', 'hidden');
          }, trial.timing_stim - info.rt);
          setTimeout(function() {
            doFeedback(correct, timeout);
          }, trial.timing_response - info.rt);
        }
        else {
          setTimeout(function() {
            display_element.html('');
            doFeedback(correct, timeout);
          }, trial.timing_response - info.rt);
        }
      }
    }
   // start button listeners

   $('#button-1').on('click', function() {

    after_response({

      key: trial.choices[0],

      rt: (new Date()).getTime() - start_time

    });

  });



  $('#button-2').on('click', function() {

    after_response({

      key: trial.choices[1],

      rt: (new Date()).getTime() - start_time

    });
    });

    var start_time = (new Date()).getTime();



    // end trial if timing_response is set

    if (trial.timing_response > 0) {
      setTimeoutHandlers.push(setTimeout(function() {
        after_response({
          key: -1,
          rt: -1
        });
      }, trial.timing_response));
    }

    function doFeedback(correct, timeout) {

      if (timeout && !trial.show_feedback_on_timeout) {
        display_element.append(trial.timeout_message);
      } else {
        // show image during feedback if flag is set
        if (trial.show_stim_with_feedback) {
          if (!trial.is_html) {
            // add image to display
            trial_container.append($('<img>', {
              "src": trial.stimulus,
              "class": 'jspsych-poldrack-categorize-stimulus',
              "id": 'jspsych-poldrack-categorize-stimulus'
            }));
          } else {
            trial_container.append($('<div>', {
              "id": 'jspsych-poldrack-categorize-stimulus',
              "class": 'jspsych-poldrack-categorize-stimulus',
              "html": trial.stimulus
            }));
          }
        }

        // substitute answer in feedback string.
        var atext = "";
        if (correct) {
          atext = trial.correct_text.replace("%ANS%", trial.text_answer);
        } else {
          atext = trial.incorrect_text.replace("%ANS%", trial.text_answer);
        }

        // show the feedback
        display_element.append(atext);
      }
      // check if force correct button press is set
      if (trial.force_correct_button_press && correct === false && ((timeout && trial.show_feedback_on_timeout) || !timeout)) {

        var after_forced_response = function(info) {
          endTrial();
        }

        $('#button-1').on('click', after_forced_response);

        $('#button-2').on('click', after_forced_response);

      } else {
        setTimeout(function() {
          endTrial();
        }, trial.timing_feedback_duration);
      }

    }

    function endTrial() {
      display_element.html("");
      jsPsych.finishTrial(trial_data);
    }

  };

  return plugin;
})();

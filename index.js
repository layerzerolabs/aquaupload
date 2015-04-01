$(function() {

  // Send api key with every request
  $(document).ajaxSend(function(e, xhr, options) {
    xhr.setRequestHeader("x-api-key", 'OoheiN8uyaiB7Iefahloo3aZAu3Ahnah');
  });

  var app = new Marionette.Application();
  
  // Controls the message bar at the top of the page
  var showMessage =  function(cssClass, message) {
    $('#message').removeClass().addClass(cssClass);
    $('#message').html(message);
    setTimeout(function() {
      $('#message').empty();
      $('#message').removeClass('success').removeClass('error');
    }, 1000);
  };

  // Provides regions for the input form and saved-data table
  var Layout = Backbone.Marionette.LayoutView.extend({
    el: '#content',
    template: "#layout-template",    
    regions: {
      form: "#form",
      savedData: "#saved-data"
    },
  });
 
  var Reading = Backbone.Model.extend({
    urlRoot: 'http://localhost:8003/todmorden',
  });

  // Initialise the set of saved data. It will disappear with the session but that's OK -
  // it's just there for short-term reviewing and correcting (by deletion) of inserted data
  var SavedData = Backbone.Collection.extend({model: Reading});
  var savedData = new SavedData();

  // The upload form
  var FormView = Marionette.ItemView.extend({
    populateDropdown: function() {
      $('[name=sensor_name]').after('<img src="ajax-loader.gif">');
      $.ajax({
        url: 'http://localhost:8003/todmorden/categories/',
        success: function(data) {
          data.forEach(function(category) {
            // Keep the last option ("Add New") at the bottom
            $('select option:last').before('<option value = "' + category + '">' + category + '</option>');
          });
          $('img').remove();
        }
      });
    },
    validationRules: {
      sensor_name: {
        required: true
      },
      reading_hours: {
        required: true,
        number: true,
        min: 0,
        max: 23
      },
      reading_minutes: {
        required: true,
        number: true,
        min: 0,
        max: 59
      },
      reading_value: {
        required: true
      }
    },
    applyFormValidation: function() {
      // Couldn't use backbone.validation because the separate inputs for date, hour and minutes
      // mean that the form elements don't correspond to the model attributes. So using jQuery.validate
      var that = this;
      this.$('form').validate({
        groups: {
          reading_time: 'reading_minutes reading_hours'
        },
        errorPlacement: function(error, element) {
          if (element.attr("name") == "reading_hours") {
            error.insertAfter("[name=reading_minutes]");
          } else {
            error.insertAfter(element);
          }
        },
        rules: that.validationRules 
      });
    },
    onRender: function() {
      this.populateDropdown();
      this.$('[name=reading_date]').datepicker({dateFormat: 'd M yy'});
      this.applyFormValidation();
    },
    template: '#form-template', 
    events: {
      'submit form': 'uploadData',
      'change select': 'perhapsShowTextBox'
    },
    addNewNameToOptions: function() {
      var category = this.model.get('sensor_name');
      $('select option:last').before('<option value = "' + category + '">' + category + '</option>');
    },
    // Parse the multiple date-time parts into a date object with time
    uploadData: function(e) {
      e.preventDefault();
      this.model = new Reading();
      this.model.set('sensor_name', $('[name=sensor_name]').val());
      this.model.set('reading_value', $('[name=reading_value]').val());
      var readingTime = moment($('[name=reading_date]').val(), 'D MMM YYYY');
      readingTime.hours($('[name=reading_hours]').val());
      readingTime.minutes($('[name=reading_minutes]').val());
      this.model.set('reading_time', readingTime.format());
      var that = this;
      this.model.save(null, {
        success: function(model) {
          showMessage('success', 'Saved');
          savedData.add(that.model);
          that.$('form')[0].reset();
          if (that.sensorNameIsNew) {
            that.closeTextBox();
            that.addNewNameToOptions();
            that.sensorNameIsNew = false;
          }
        },
        error: function(err, res) {
          showMessage('error', 'Not Saved');
        }
      });
    },
    perhapsShowTextBox: function(e) {
      var that = this;
      this.savedSelect = this.$('select');
      if ($(e.target).val() === 'new') {
        this.$('select').replaceWith(
          '<div id=new><input type=text name=sensor_name></div'
        );
        that.sensorNameIsNew = true;
        that.applyFormValidation();
      }
    },
    closeTextBox: function() {
      this.$('#new').replaceWith(this.savedSelect);
      this.$('select').val('');
    }
  });


  // View for single item of saved data, which can be deleted
  var SavedDataRow = Marionette.ItemView.extend({
    tagName: 'tr',
    template: '#saved-data-template',
    events: {
      'click button.delete': 'deleteReading'
    },
    deleteReading: function() {
      this.model.destroy({
        wait: true,
        error: function(err, res) {
          showMessage('error', 'Not deleted');
        },
        success: function(err, res) {
          showMessage('success', 'Deleted');
        }
      });
    }
  });

  // View for whole table of saved data
  var SavedDataView = Marionette.CollectionView.extend({
    childView: SavedDataRow,
    tagName: 'table' 
  });

  // Initialisation
  app.on('start', function() {
    var layout = new Layout();
    layout.render();
    layout.form.show(new FormView({model: new Reading()}));
    layout.savedData.show(new SavedDataView({collection: savedData}));
  });
  app.start();

});

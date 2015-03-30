$(function() {
    
  var app = new Marionette.Application();
  
  var showMessage =  function(cssClass, message) {
    $('#message').removeClass().addClass(cssClass);
    $('#message').html(message);
    setTimeout(function() {
      $('#message').empty();
      $('#message').removeClass('success').removeClass('error');
    }, 1000);
  };

  var Layout = Backbone.Marionette.LayoutView.extend({
    el: '#content',
    template: "#layout-template",    
    regions: {
      form: "#form",
      savedData: "#saved-data"
    },
  });

  var Reading = Backbone.Model.extend({
    urlRoot: 'http://localhost:8003/todmorden?api_key=OoheiN8uyaiB7Iefahloo3aZAu3Ahnah',
    validation: {
      sensor_name: {
        required: true
      },
      reading_date: function (val){
        if (val === '') {
          return 'Required';
        }
        if (!moment(val, 'D MMM YYYY').isValid()) {
          return 'Must be a date in the format "1 Jan 2000"';
        }
      },    
      reading_hour: {
        required: true
      },
      reading_minute: {
        required: true
      },
      reading_value: {
        required: true
      }
    },
    formatForAPI: function() {
      var readingTime = moment(this.get('reading_date'), 'D MMM YYYY');
      readingTime.hours(this.get('reading_hour'));
      readingTime.minutes(this.get('reading_minute'));
      this.set('reading_time', readingTime.format());
      this.unset('reading_date');
      this.unset('reading_hour');
      this.unset('reading_minute');
    }
  });

  var SavedData = Backbone.Collection.extend({model: Reading});
  var savedData = new SavedData();
  var FormView = Marionette.ItemView.extend({
    initialize: function() {
      Backbone.Validation.bind(this);
    },
    onRender: function() {
      this.$('input').eq(1).datepicker({dateFormat: 'd M yy'});
    },
    template: '#form-template', 
    events: {
      'submit form': 'uploadData'
    },
    uploadData: function(e) {
      e.preventDefault();
      this.model = new Reading();
      this.model.set('sensor_name', $('[name=sensor_name]').val());
      this.model.set('reading_date', $('[name=reading_date]').val());
      this.model.set('reading_hour', $('[name=reading_hour]').val());
      this.model.set('reading_minute', $('[name=reading_minute]').val());
      this.model.set('reading_value', $('[name=reading_value]').val());
      this.model.formatForAPI();
      var that = this;
      this.model.save(null, {
        success: function(model) {
          showMessage('success', 'Saved');
          savedData.add(that.model);
          that.$('form')[0].reset();
        },
        error: function(err, res) {
          showMessage('error', 'Not Saved');
        }
      });
    }
  });

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

  var SavedDataView = Marionette.CollectionView.extend({
    childView: SavedDataRow,
    tagName: 'table' 
  });

  app.on('start', function() {
    var layout = new Layout();
    layout.render();
    layout.form.show(new FormView({model: new Reading()}));
    layout.savedData.show(new SavedDataView({collection: savedData}));
  });

  app.start();

});

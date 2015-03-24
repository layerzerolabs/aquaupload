$(function() {
    
  var app = new Marionette.Application();

  var Layout = Backbone.Marionette.LayoutView.extend({
    el: '#content',
    template: "#layout-template",    
    regions: {
      form: "#form",
      savedData: "#saved-data"
    },
  });

  var Reading = Backbone.Model.extend({
    urlRoot: '/',
    validation: {
      category: {
        required: true
      },
      time: {
        required: true
      },
      value: {
        required: true
      }
    }    
  });

  var SavedData = Backbone.Collection.extend({model: Reading});
  var savedData = new SavedData();

  var FormView = Marionette.ItemView.extend({
    initialize: function() {
      Backbone.Validation.bind(this);
    },
    template: '#form-template', 
    events: {
      'submit form': 'uploadData'
    },
    clearMessages: function() {
      var that = this;
      setTimeout(function() {
        that.$('.messages').empty();
      }, 1000);
    },
    uploadData: function(e) {
      e.preventDefault();
      this.model.set('category', $('[name=category]').val());
      this.model.set('time', $('[name=time]').val());
      this.model.set('value', $('[name=value]').val());
      var reading = this.model;
      var that = this;
      this.model.save(null, {
        error: function() {
          that.$('.messages').addClass('error').removeClass('success');
          that.$('.messages').html('<p>Error saving data</p>');
          that.clearMessages();
        },
        success: function() {
          that.$('.messages').addClass('success').removeClass('error');
          that.$('.messages').html('<p>Saved succesfully</p>');
          savedData.add(reading);
          that.$('form')[0].reset();
          that.clearMessages();
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
      console.log(this.model);
      this.model.destroy({wait: true});
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

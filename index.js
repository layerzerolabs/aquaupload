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
  var id = 0; // TODO
  var FormView = Marionette.ItemView.extend({
    initialize: function() {
      Backbone.Validation.bind(this);
    },
    template: '#form-template', 
    events: {
      'submit form': 'uploadData'
    },
    uploadData: function(e) {
      e.preventDefault();
      this.model.set('category', $('[name=category]').val());
      this.model.set('time', $('[name=time]').val());
      this.model.set('value', $('[name=value]').val());
      var that = this;
      this.model.save(null, {
        success: function() {
          showMessage('success', 'Saved');
          that.model.set('id', ++id); //TODO
          savedData.add(that.model);
          that.model = new Reading();
          that.$('form')[0].reset();
          that.clearMessages();
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

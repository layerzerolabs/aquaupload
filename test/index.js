/* jshint expr: true */

var expect = chai.expect;

describe('Form', function() {
  it('Should appear on page', function() {
    expect($('form').length).to.equal(1);
  });
  it('Should have 5 text inputs', function() {
    expect($('form input[type=text]').length).to.equal(5);
  });
  it('Should have a datepicker', function() {
    expect($('.ui-datepicker').length).to.equal(1);

  });
  it('Should have a submit button', function() {
    expect($('form input[type=submit]').length).to.equal(1);
  });
});

describe('Saved data table', function() {
  it('should be empty', function() {
    expect($('#saved-data table').is(':empty')).to.be.true; 
  });
});
describe('Form validation', function() {
  it('All fields should be required', function() {
    $('form input[type=submit]').click();
    expect($('.invalid').length).to.equal(5);
  });
  it('Non-date for reading date should cause error', function() {
    $('[name=reading_date]').val('foo');
    $('form input[type=submit]').click();
    expect($('.invalid').length).to.equal(5);
  });
});

describe('On submitting form with valid data', function() {
  var server;

  // data to input
  var sensor_name = 'Fires',
    reading_date = '3 Jan 2000',
    reading_hours = 13,
    reading_minutes = 20,
    reading_value = 'Many';
  
  // app should combine date and times into a datetime
  var expectedReadingTime = moment('3 Jan 2000 13:20', 'D MMM YYYY HH:mm');

  before(function() {
    server = sinon.fakeServer.create();
    sinon.spy($, "ajax");
    $('[name=sensor_name]').val(sensor_name);
    $('[name=reading_date]').val(reading_date);
    $('[name=reading_hours]').val(reading_hours);
    $('[name=reading_minutes]').val(reading_minutes);
    $('[name=reading_value]').val(reading_value);
  });
  it('Should not show validation errors', function() {
    $('form input[type=submit]').click();
    expect($('.invalid').length).to.equal(0);
  });
  it('Should fire an ajax request', function() {
    $('form input[type=submit]').click();
    expect($.ajax.called).to.be.true;
  });
  it('Which should be a POST request', function() {
    $('form input[type=submit]').click();
    expect($.ajax.getCall(0).args[0].type).to.equal('POST');
  });
  it('The URL should be localhost:8003/todmorden', function() {
    expect($.ajax.getCall(0).args[0].url).to.equal('http://localhost:8003/todmorden');
  });
  it('The data sent should have sensor_name, reading_time  and reading_value properties', function() {
    var data  = JSON.parse($.ajax.getCall(0).args[0].data);
    expect(data).to.have.property('sensor_name');
    expect(data).to.have.property('reading_time');
    expect(data).to.have.property('reading_value');
  });
  it('The data sent should only three properties', function() {
    var data  = JSON.parse($.ajax.getCall(0).args[0].data);
    expect(Object.keys(data).length).to.equal(3);
  });
  it('The data sent should reading_time property', function() {
    var data  = JSON.parse($.ajax.getCall(0).args[0].data);
    expect(data).to.have.property('reading_time');
  });
  it('The reading_time should be a valid date in ISO format', function() {
    var data  = JSON.parse($.ajax.getCall(0).args[0].data);
    expect(moment(data.reading_time, 'YYYY-MM-DDTHH:mm:ss+HH:mm', true).isValid()).to.be.true;
  });
  it('The reading_time should be made up of reading_date, reading_hourss and reading_minutess', function() {
    var data  = JSON.parse($.ajax.getCall(0).args[0].data);
    expect(moment(data.reading_time).format()).to.equal(expectedReadingTime.format());
  });
  describe('On getting error response from server', function() {
    it('If post not successful, should display error message', function() {
      server.respondWith([500, {'Content-Type': 'text/html'}, '{"some": "json"}']);
      $('form input[type=submit]').click();
      server.respond();
      expect($('#message').hasClass('error')).to.be.true;
      expect($('#message').hasClass('success')).to.be.false;
    });
  });
  describe('On getting success response from server', function() {
    beforeEach(function() {
      server.respondWith([
          200,
          {'Content-Type': 'text/html'},
          '{"id": '+Math.floor(Math.random()*1000)+ '}'
      ]);
    }); 
    it('should clear form', function() {
      $('form input[type=submit]').click();
      server.respond();
      $('form input[type=text]').each(function() {
        expect($(this).val()).to.equal('');
      });
    });
    it('should display success message', function() {
      expect($('#message').hasClass('success')).to.be.true;
      expect($('#message').hasClass('error')).to.be.false;
      expect($('#message').is(':empty')).to.be.false;
    });
    it('should add a row to the saved data list', function() {
      expect($('#saved-data tr').length).to.equal(1); 
    });
    it('Row should have 4 cells', function() {
      expect($('#saved-data tr').find('td').length).to.equal(4); 
    });
    it('Last cell should be a delete button', function() {
      expect($('#saved-data td').eq(3).find('button.delete').length).to.equal(1);
    });
    it('First cell should contain sensor_name', function() {
      expect($('#saved-data td').eq(0).html()).to.equal(sensor_name);
    });
   // it('Second cell should contain reading_time nicely formatted', function() {
   //   expect($('#saved-data td').eq(1).html()).to.equal(moment(reading_time).format());
   // });
    it('Third cell should contain reading_value', function() {
      expect($('#saved-data td').eq(2).html()).to.equal(reading_value);
    });
    it('Submitting form again should create another row', function() {
      $('[name=sensor_name]').val(sensor_name);
      $('[name=reading_date]').val(reading_date);
      $('[name=reading_hours]').val(reading_hours);
      $('[name=reading_minutes]').val(reading_minutes);
      $('[name=reading_value]').val(reading_value);
      $('form input[type=submit]').click();
      server.respond();
      expect($('#saved-data tr').length).to.equal(2);
    });
    describe('Deleting saved data', function() {
      it('Clicking delete should send an ajax DELETE request', function() {
        $.ajax.reset();
        $('#saved-data td').eq(3).find('button.delete').click();
        expect($.ajax.getCall(0).args[0].type).to.equal('DELETE');
      });
      it('But should not remove the item if it returns an error', function() {
        server.respondWith([405, {'Content-Type': 'text/html'}, '{"error": "foo"}']);
        server.respond();
        expect($('#saved-data tr').length).to.equal(2);
      });
      it('And should show error message', function() {
        expect($('#message').hasClass('error')).to.be.true;
        expect($('#message').hasClass('success')).to.be.false;
        expect($('#message').is(':empty')).to.be.false;
      });
      it('Should remove if delete is successful', function() {
        server.respondWith([200, {'Content-Type': 'text/html'}, '{"it\'s": "gone"}']);
        $('#saved-data td').eq(3).find('button.delete').click();
        server.respond();
        expect($('#saved-data tr').length).to.equal(1);
      });
      it('And should show success message', function() {
        expect($('#message').hasClass('error')).to.be.false;
        expect($('#message').hasClass('success')).to.be.true;
        expect($('#message').is(':empty')).to.be.false;
      });
    });
  });
});

Devices = new Mongo.Collection("devices");
Services = new Mongo.Collection("services");

if (Meteor.isClient) {
  Template.body.helpers({
    Devices: function () {
      return Devices.find({});
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Devices.remove({});
		Services.remove({});
  });
}

if (Meteor.isCordova) {
  var metricServiceUuid = 'E4E8AC1C-627D-4E3A-B92B-CD2CB62233E1';
  var locationCharacteristicUuid = '11B5529C-93F0-490B-BA14-9CDD10070AEE';
	var params = {};

  Session.set('devices', [])

  Template.body.helpers({
		scan: function() {
			console.log('scan ', Session.get('scan'));
			return Session.get('scan');
		},
    devices: function() {
      return Devices.find();
    },
		bleresult: function() {
			console.log('bleresult ', Session.get('bleresult'));
			return Session.get('bleresult');
		},
		connected: function() {
			return Session.get('connected');
		}
  });

  Template.body.events({
    'click button[name=scan]': function () {
			console.log('clicked scan');
			startScanning();
			isScanning();
//			easyble.startScan;
		},
		'click button[name=stop]': function () {
			stopScanning();
			isScanning();
		}
  });

	Template.device.helpers({
		connected: function(){
			if (this.address === Session.get('connected').address) {
//			console.log('checking isCOnnected ', this.address);
//			isConnected(this.address);
				console.log('checking isConnected ', Session.get('connected'));
	//			isConnected(this.address);
	//			console.log(' connected ', Session.get('connected'));
				return Session.get('connected');
			//return 'test';
			}
		},
		status: function() {
			console.log('bleresult ', Session.get('bleresult'));
			if ((Session.get('bleresult').error === 'connect') && (Session.get('bleresult').address === this.address)){
				return true;
			}
		},
	}); 
	
  Template.device.events({
		'click button[name=discover]': function() {
			discover(this.address);
		},
    'click button[name=connect]': function() {
      connect(this.address);
    },
/* 		'click button[name=retrieve]': function() {
			retrieve(this.address);
		}, */
    'click button[name=disconnect]': function() {
      disconnect(this.address);
    },
    'click button[name=close]': function() {
      close(this.address);
    }
  })

  Meteor.startup(function () {
    logInfo('Initializing...')
    bluetoothle.initialize(function(result) {
      logResult('Initialize', result);
    }, logError, {
      request: true
    });
  });

	
  function startScanning() {
		isScanning;
		console.log('Starting scan...');
    logInfo('Starting scan...');
		

    bluetoothle.startScan(
			function(result) {
//      logResult('Start scan', result);
//			logResult(' scan status ', result.status);
				if(result.status === 'scanResult') {
					var devices = Session.get('devices');
					Session.set('bleresult', result);
					devices.push({ name:result.name, address:result.address });
	//        Session.set('devices', devices);
					if (! Devices.findOne({address:result.address})) {
						Session.set('devices', devices);
						logResult('Addubg new device ', result);
						Devices.insert({ name:result.name, address:result.address  })
					}
				}
			}, 
			function (error) {
				logError (error);
				isScanning;
			}, {});
  }

	function isScanning(){
		console.log('isScan check'); 
		bluetoothle.isScanning(function(result) {
      logResult('isScanning ', result);
			Session.set('scan', result);
		});	
	}
	
	function isConnected(address){
		console.log('isconnected function check for ', address);
		bluetoothle.isConnected(
			function(result) {
				console.log('isconnected ', result);
				Session.set('connected', result);
			},
			{address: address}
		);
	}
	
  function stopScanning() {
    logInfo('Stopping scan...');
    bluetoothle.stopScan(function(result) {
      logResult('Stop scan', result);
			isScanning;
    });
  }

  function discover(address) {
		stopScanning;
    logInfo('Starting discover...' + address);

    bluetoothle.discover(
			function(result) {
				logResult('discover ', result);
				Session.set('bleresult', result);
			}, 
			function(error) {
				console.log('discover error ', error);
				Session.set('bleresult', error);
			},
			{ address: address}
		);
		isConnected(address);
	}	
	
  function connect(address) {
		stopScanning;
    if(!address) {
      logError("Can't connect without an address");
      return;
    }

    logInfo('Connecting to: ' + address);
    bluetoothle.connect(function(result) {
      logResult('Connect', result);
			Session.set('bleresult', result);
			isConnected(address);

/*       if(result.status === 'connected') {
        getServices(address);
      } */
    }, logError, {
      address: address
    });
		isConnected(address);
	}

	function retrieve(address) {
		stopScanning;
		logInfo('Retrieving to: ' + address);
		bluetoothle.retrieveConnected(			
			function(result) {
				logResult('retrieveConnected ', result);
				Session.set('bleresult', result);
			}, 
			function(error) {
				console.log('retrieveConnected error ', error);
				Session.set('bleresult', error);
			}, 
			{address: address}
		);
	}

  function disconnect(address) {
		stopScanning;
    if(!address) {
      logError("Can't disconnect without an address");
      return;
    }

    logInfo('DisConnecting to: ' + address);
    bluetoothle.disconnect(function(result) {
      logResult('DisConnect', result);
			Session.set('bleresult', result);

      if(result.status === 'disconnected') {
        logResult('disconnected ', address);
				Session.set('bleresult', result);
				close(address);
      }
    }, logError, {
      address: address
    });
		isConnected(address);
  }

  function close(address) {	
		stopScanning;
		disconnect(address);
		bluetoothle.close(
			function(result) {
				logResult('close ', result);
				Session.set('bleresult', result);
			}, 
			function(error) {
				console.log('close error ', error);
				Session.set('bleresult', error);
			},
			{ address: address}
		);
		isConnected(address);
	}
	
  function getServices(address) {
    if(!address) {
      logError("Can't get services without an address");
      return;
    }

    logInfo('Getting services for address:' + address);
    bluetoothle.services(function(result) {
      logResult('Services', result);
			Session.set('bleresult', result);

      if(result.status === 'services') {
        getCharacteristics(address)
      }
    }, logError, {
      address: address,
      serviceUuids: [ metricServiceUuid ]
    })
  }

  function getCharacteristics(address) {
    if(!address) {
      logError("Can't get characteristics without an address");
      return;
    }

    logInfo('Getting characteristics for address:' + address);
    bluetoothle.characteristics(function(result) {
      logResult('characteristics', result);

      if(result.status === 'characteristics') {
        subscribeToLocation(address)
      }
    }, logError, {
      address: address,
      serviceUuid: metricServiceUuid,
      characteristicUuids: [ locationCharacteristicUuid ]
    })
  }

  function subscribeToLocation(address) {
    if(!address) {
      logError("Can't subscribe without an address");
      return;
    }

    logInfo('Subscribing to location of: ' + address)
    bluetoothle.subscribe(function(result) {
      logResult('Subscribe', result);

      if(result.status === 'subscribedResult') {
        logInfo('Value: ' + result.value);
        var encoded = result.value;
        var decoded = bluetoothle.encodedStringToBytes(encoded);
        var locationData = bluetoothle.bytesToString(decoded);
        logInfo('locationData:' + locationData.toString());
        Devices.insert({ text:locationData })
      }
    }, logError, {
      address: address,
      serviceUuid: metricServiceUuid,
      characteristicUuid: locationCharacteristicUuid,
      isNotification: true
    })
  }

  function logInfo(message) {
    console.log('[BLE] '+message);
  }

  function logResult(name, result) {
    logInfo(name + ' status:', result.status);
    console.log(result);
  }

  function logError(message) {
    logInfo('Error:');
    console.log(message);
		Session.set('bleresult', message);
		isScanning;
  }

	var arduinoble = (function()	{
		// Arduino BLE object.
		var arduinoble = {};

		// Internal functions.
		var internal = {};

		// Stops any ongoing scan and disconnects all devices.
		arduinoble.close = function()
		{
			easyble.stopScan();
			easyble.closeConnectedDevices();
		};

		// Connect to a BLE-shield.
		// Success callback: win(device)
		// Error callback: fail(errorCode)
		arduinoble.connect = function(win, fail)
		{
			easyble.startScan
			(
				function(device)
				{
						/*
					if (device.name == 'BLE Shield')
					{
						easyble.stopScan();
						internal.connectToDevice(device, win, fail);
					}
					*/
						
					if (device.name == 'eMOTION_Pi')
					{
						easyble.stopScan();
						internal.connectToDevice(device, win, fail);
					}
									
					
				},
				function(errorCode)
				{
					fail(errorCode);
				});
		};

		internal.connectToDevice = function(device, win, fail)
		{
			device.connect(
				function(device)
				{
					// Get services info.
					internal.getServices(device, win, fail);
				},
				function(errorCode)
				{
					fail(errorCode);
				});
		};

		
		internal.getServices = function(device, win, fail)
		{
			device.readServices(
				null, // null means read info for all services
				//'6e400001-b5a3-f393-e0a9-e50e24dcca9e',
				//'6e400003-b5a3-f393-e0a9-e50e24dcca9e',
				function(device)
				{
					internal.addMethodsToDeviceObject(device);
					win(device);
				},
				function(errorCode)
				{
					fail(errorCode);
				});
		};

		internal.addMethodsToDeviceObject = function(device)
		{
			device.writeDataArray = function(uint8array)
			{
			
			/*
		 nRF UART UUIDs used are:  
			6E400001-B5A3-F393-E0A9-E50E24DCCA9E for the Service
			6E400002-B5A3-F393-E0A9-E50E24DCCA9E for the TX Characteristic
			6E400003-B5A3-F393-E0A9-E50E24DCCA9E for the RX Characteristic		
		*/
			
			
				device.writeCharacteristic(
					//'713d0003-503e-4c75-ba94-3148f18d941e',
					//'6E400002-B5A3-F393-E0A9-E50E24DCCA9E',
					
					'6e400002-b5a3-f393-e0a9-e50e24dcca9e',
					
					uint8array,
					function()
					{
						
						console.log('writeCharacteristic success');
					},
					function(errorCode)
					{
						console.log('writeCharacteristic error: ' + errorCode);
					});
			};
		};

		return arduinoble;
	})();
	
}

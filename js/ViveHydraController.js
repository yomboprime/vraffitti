/**
 * @author mrdoob / http://mrdoob.com
 * @author yomboprime
 */

THREE.ViveHydraController = function ( id ) {

	THREE.Object3D.call( this );

	var scope = this;
	var gamepad;

	var axes = [ 0, 0 ];
	var thumbpadIsPressed = false;
	var triggerIsPressed = false;
	var gripsArePressed = false;
	var menuIsPressed = false;

	this.matrixAutoUpdate = false;
	this.standingMatrix = new THREE.Matrix4();

	this.CONTROLLER_HTC_VIVE = 0;
	this.CONTROLLER_RAZER_HYDRA = 1;
	this.controllerType = undefined;

	this.razerHydraGamepad = null;
	this.razerHydraBaseOffset = new THREE.Vector3( -0.4, -1.25, 0.8 );

	this.getGamepad = function () {

		return gamepad;

	};

	this.getButtonState = function ( button ) {

		if ( button === 'thumbpad' ) return thumbpadIsPressed;
		if ( button === 'trigger' ) return triggerIsPressed;
		if ( button === 'grips' ) return gripsArePressed;
		if ( button === 'menu' ) return menuIsPressed;

	};

	this.update = function () {

		if ( scope.controllerType === scope.CONTROLLER_HTC_VIVE ) {

			gamepad = navigator.getGamepads()[ id ];

		}
		else if ( scope.controllerType === scope.CONTROLLER_RAZER_HYDRA ) {

			gamepad = pollRazerHydra();

		}
		else if ( scope.controllerType === undefined ) {

			gamepad = detectDevice();

		}

		if ( gamepad !== undefined && gamepad.pose !== null ) {

			//  Position and orientation.

			var pose = gamepad.pose;

			scope.position.fromArray( pose.position );
			scope.quaternion.fromArray( pose.orientation );
			scope.matrix.compose( scope.position, scope.quaternion, scope.scale );
			scope.matrix.multiplyMatrices( scope.standingMatrix, scope.matrix );
			scope.matrixWorldNeedsUpdate = true;
			scope.visible = true;

			//  Thumbpad and Buttons.

			if ( axes[ 0 ] !== gamepad.axes[ 0 ] || axes[ 1 ] !== gamepad.axes[ 1 ] ) {

				axes[ 0 ] = gamepad.axes[ 0 ]; //  X axis: -1 = Left, +1 = Right.
				axes[ 1 ] = gamepad.axes[ 1 ]; //  Y axis: -1 = Bottom, +1 = Top.
				scope.dispatchEvent( { type: 'axischanged', axes: axes } );

			}

			if ( thumbpadIsPressed !== gamepad.buttons[ 0 ].pressed ) {

				thumbpadIsPressed = gamepad.buttons[ 0 ].pressed;
				scope.dispatchEvent( { type: thumbpadIsPressed ? 'thumbpaddown' : 'thumbpadup' } );

			}

			if ( triggerIsPressed !== gamepad.buttons[ 1 ].pressed ) {

				triggerIsPressed = gamepad.buttons[ 1 ].pressed;
				scope.dispatchEvent( { type: triggerIsPressed ? 'triggerdown' : 'triggerup' } );

			}

			if ( gripsArePressed !== gamepad.buttons[ 2 ].pressed ) {

				gripsArePressed = gamepad.buttons[ 2 ].pressed;
				scope.dispatchEvent( { type: gripsArePressed ? 'gripsdown' : 'gripsup' } );

			}

			if ( menuIsPressed !== gamepad.buttons[ 3 ].pressed ) {

				menuIsPressed = gamepad.buttons[ 3 ].pressed;
				scope.dispatchEvent( { type: menuIsPressed ? 'menudown' : 'menuup' } );

			}


		} else {

			scope.visible = false;

		}

	}

	function detectDevice() {

		var gamepads = navigator.getGamepads();

		if ( gamepads.length === 0 ) {

			return undefined;

		}

		// Search for Razer Hydra

		var anyController = false;
        var hydraController = null;
        for ( var gamepadIndex = 0, il = gamepads.length; gamepadIndex < il; gamepadIndex++ ) {

            var controller = gamepads[ gamepadIndex ];
            if ( controller ) {

				anyController = true;

                if ( controller && controller.id.indexOf( "Hydrajoy virtual joystick") >= 0 ) {

                    hydraController = controller;
                    break;

                }
            }

        }

		if ( ! anyController ) {

			return undefined;

		}

		if ( hydraController !== null ) {

			scope.controllerType = scope.CONTROLLER_RAZER_HYDRA;
			scope.razerHydraGamepad = getHydraGamepad( gamepadIndex );
			return pollRazerHydra( hydraController );

		}

		// Assume the controller is an HTC Vive
		scope.controllerType = scope.CONTROLLER_HTC_VIVE;

		return navigator.getGamepads[ id ];

	}

	function getHydraGamepad( index ) {

		var hydraGamepad = {
			index: index,
			pose: {
				position: [ 0, 0, 0 ],
				orientation: [ 0, 0, 0, 1 ]
			},
			buttons: [],
			axes: [],
			trigger: 0
		};
		
		for ( var i = 0; i < 12; i++ ) {
			hydraGamepad.buttons[ i ] = {
				pressed: false
			};
		}

		for ( var i = 0; i < 2; i++ ) {
			hydraGamepad.axes[ i ] = 0.0;
		}

		return hydraGamepad;

	}

	function pollRazerHydra( hydraController ) {

		var dummyHydraGamepad = scope.razerHydraGamepad;

		if ( hydraController === undefined ) {

			var gamepads = navigator.getGamepads();

			hydraController = gamepads[ dummyHydraGamepad.index ];

		}

		if ( hydraController ) {
			
		
			var pos = dummyHydraGamepad.pose.position;
			var quat = dummyHydraGamepad.pose.orientation;
			var offset = scope.razerHydraBaseOffset;

			var id0 = id === 0;

			// pose

			pos[ 0 ] = hydraController.axes[ id0 ? 0 : 8 ] * 4 - offset.x;
			pos[ 1 ] = hydraController.axes[ id0 ? 1 : 9 ] * 4 - offset.y;
			pos[ 2 ] = hydraController.axes[ id0 ? 2 : 10 ] * 4 - offset.z;
			quat[ 0 ] = hydraController.axes[ id0 ? 3 : 11 ];
			quat[ 1 ] = hydraController.axes[ id0 ? 4 : 12 ];
			quat[ 2 ] = hydraController.axes[ id0 ? 5 : 13 ];
			quat[ 3 ] = hydraController.axes[ id0 ? 6 : 14 ];

			// buttons

			dummyHydraGamepad.trigger = hydraController.axes[ id0 ? 7 : 15 ];

			// thumb
			dummyHydraGamepad.buttons[ 0 ].pressed = hydraController.buttons[ id0 ? 6 : 6 + 12 ].pressed;
			// trigger
			dummyHydraGamepad.buttons[ 1 ].pressed = dummyHydraGamepad.trigger > 0.5 ? 1 : 0;
			// grips
			dummyHydraGamepad.buttons[ 2 ].pressed = hydraController.buttons[ id0 ? 1 : 1 + 12 ].pressed;
			// menu
			dummyHydraGamepad.buttons[ 3 ].pressed = hydraController.buttons[ id0 ? 0 : 0 + 12 ].pressed;

			// joystick

			for ( var i = 0; i < 2; i++ ) {

				dummyHydraGamepad.axes[ i ] = hydraController.axes[ id0 ? i + 16 : i + il + 16 ];

			}

			return dummyHydraGamepad;

		}

		return undefined;

	}

};

THREE.ViveHydraController.prototype = Object.create( THREE.Object3D.prototype );
THREE.ViveHydraController.prototype.constructor = THREE.ViveHydraController;

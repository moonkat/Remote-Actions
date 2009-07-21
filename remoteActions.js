//Requires jquery.js., jquery.livequery.js, jquery.simplemodal.js, console log, and actions function, below
$(document).ready(function(){
	/**
	 * Console Log
	 */
	var debug = false; // set to false to disable logging for production
	var log = function() {
		if (!debug)
			return false;
		try {
			if (window.console && window.console.firebug || typeof firebug === 'object')
	  			console.log.apply(this, arguments);
	  	} catch(err) {
			alert(err.description+'\nmake sure firebug light\nis included in the header before\nautomator.js');
		}
	}
	log('Starting Error Log...');
	
	/**
	 * Actions
	 * 
	 * This is a LIVE function.
	 * Perform specified click actions based on control character.
	 * @requires jquery.simplemodal.js
	 * @example
	 * <.. actions="+thisdiv"> - show thisdiv onClick
	 * <.. actions="-thisdiv"> - hide thisdiv onClick
	 * <.. actions="+thisdiv -thatdiv"> - get it?
	 * <.. actions="^modalID"> - pops up targetID as a modal panel
	 * <.. actions="^-modalID"> - closes modal panel
	 * <.. actions="+thisdiv :-thatdiv"> - Huh? It's for toggling!
	 * Once you prepend a ":" to an action, that means to do this on the toggle, or second time you click.
	 * Once click has been pressed once, the colons are swapped from active to toggle states, and when you click
	 * again, it swaps back.  It's a toggle!
	 * 
	 * Transition Modifier
	 * @example
	 * <.. actions="+thisdiv" actiontransition="instant" actiontransitionspeed="fast">
	 * actiontransition: defaults to an instant out, followed by a fadein. Optional values include "fade", "instant"
	 * actiontransitionspeed: default is value of animationLengthShow, integers represent milliseconds (1000=1 second), values - any value that can be used with jQuery hide()/show()
	 *
	 */
	var animationLengthShow 		= "medium";
	var animationLengthHide 		= "medium";
	var actionTag 				= "actions";
	var actionSelector 			= "[actions]";
	var actionTransition 		= "actionTransition";
	var actionTransitionTag 		= "[actionTransition]";
	var actionTransitionSpeed 	= "transitionspeed";
	var hideSelector 			= "[hide='true']";
	
	$(hideSelector).hide();
	$(actionSelector).livequery( function() {
		var evnt = "click";	
		//log("boo");
		// Determine appropriate event type based on element type
		if (this.tagName == 'INPUT' || this.tagName == 'SELECT') {			
			evnt = "change";
			if($(this).attr("type") == "button" || $(this).attr("type") == "radio" || $(this).attr("type") == "text" ) {
				evnt = "click";
			}			
		} else {
			$(this).css('cursor', 'pointer');
		}
		
		// Bind this function to determined event
		$(this).bind(evnt, function() {	
			var opts;
			// If element is a SELECT, assign the options of the selected OPTION
			// IE requires that a non-empty actions tag be set on the SELECT element (actions="x")
			// Any actions defined on a SELECT will be ignored if there are any child/OPTION actions, but the actions= tag is still required if the OPTIONS have actions
			
			(this.tagName == 'SELECT' && $('#'+this.id+' option:selected').attr(actionTag)) ? opts = $('#'+this.id+' option:selected').attr(actionTag).split(" ") : opts = $(this).attr(actionTag).split(" ");		
			log(opts);

			/*
			//The ! sign in actions suggests that validation is to be passed in this case	
			if (jQuery.inArray('!',opts)==-1 && $(this).isnotvalid()){
				log('validation queue has items in it');
				return;
			}
			*/			

			var showqueue = [];
			var hidequeue = [];
			var toggleornot = false; // assume that we are not toggling unless we find a :
			for (var i in opts) {
	    		switch (opts[i].substring(0,1))
				{
					case "-": hidequeue.push($('#'+opts[i].substring(1))); break;
					case "+": showqueue.push($("#"+opts[i].substring(1))); break;
					case ":": toggleornot = true; break;
					case "^": opts[i].substring(1,2) == "-" ? $.modal.close() : $("#"+opts[i].substring(1)).modal();
		    		}
		    	}
			var transpeed = $(this).attr(actionTransitionSpeed) || animationLengthShow;
			var transition;  // use transition specified in actionTransition tag or default to slow
			if ($(this).attr(actionTransition) == "instant") {
				transition = { "hide":"hide", "show":"show" };
				$(hidequeue).each( function() { $(this)[transition["hide"]](); });
				$(showqueue).each( function() { $(this)[transition["show"]](); });
			} else if($(this).attr(actionTransition) == "fade") { 
				transition = { "hide":"fadeOut", "show":"fadeIn" };
				while (showqueue.length > 0 || hidequeue.length > 0) {
					if (hidequeue.length > 0 && showqueue.length > 0) { (hidequeue.shift())[transition["hide"]](transpeed); (showqueue.shift())[transition["show"]](transpeed); }
					if (hidequeue.length > 0 && showqueue.length == 0) { (hidequeue.shift())[transition["hide"]](transpeed); }
					if (hidequeue.length == 0 && showqueue.length > 0) { (showqueue.shift())[transition["show"]](transpeed); }
				}
			} else {  //case default - fade
				transition = { "hide":"hide", "show":"fadeIn" };
				while (showqueue.length > 0 || hidequeue.length > 0) {
					if (hidequeue.length > 0 && showqueue.length > 0) { (hidequeue.shift())[transition["hide"]](); (showqueue.shift())[transition["show"]](transpeed); }
					if (hidequeue.length > 0 && showqueue.length == 0) { (hidequeue.shift())[transition["hide"]](); }
					if (hidequeue.length == 0 && showqueue.length > 0) { (showqueue.shift())[transition["show"]](transpeed); }
				}
			}
			if (toggleornot) 
			{
				var toggleaction = ""; // create new action values to set on element with toggled values
				for (var i in opts) {
	    			switch (opts[i].substring(0,1))
					{
						case "-": toggleaction += ":-"+opts[i].substring(1)+" "; break; // append : to toggle next time
						case "+": toggleaction += ":+"+opts[i].substring(1)+" "; break; // append : to toggle next time
						case ":": toggleaction += opts[i].substring(1)+" "; break; // remove : to make active
		    		}
	    		}
				$(this).attr(actionTag, toggleaction);
			}	
		});
	});
	var remoteActionTag 		= "remoteaction";
	var remoteActionSelector 	= "[remoteaction]";
	var remoteTakerTag			= "remoteactiontaker";
	/**
	 * Remote Action
	 * (or Quantum Nonlocality if that gets you going...)
	 *
	 * Enable an action assigned to one element to be actualized by the interaction with another.
	 * Assigns the action in real time so that multiple actions on one item don't conflict.
	 * 
	 * @example
	 * <... remoteaction="+myElement" remoteactiontaker="myButtonId">
	 * Will assign action in remoteaction to element in remoteactiontaker.
	 * 
	 *
	 * remoteaction is Case level
	 * remoteactiontaker is Template level
	 * @ Abhijeet Ver 1.0 - March 20, 2009
	 */
	var lastChecked = 0; // What IE issues is this fixing?
	$(remoteActionSelector).livequery(function(){	
		$(this).click(function(){

			if(($.browser.msie)){ // IE 7 Fix to Selection of Radio
				lastChecked != 0 ? lastChecked.attr("checked", "") : lastChecked = 0;	
				$(this).attr("checked", "checked");
				lastChecked = $(this);
			}
			//log('we are here'+$(this).attr(remoteActionTag).indexOf("final"));
			// define new attribute if final is declared
			if ($(this).attr(remoteActionTag).indexOf("final") >= 0){
				var NameValue = $(this).attr('final').split("=");
				$('#'+$(this).attr(remoteTakerTag)).attr(NameValue[0], NameValue[1]);
			}
			if ($(this).attr(remoteActionTag) != "false" || $(this).attr(remoteActionTag) != "final" ) {
				$('#'+$(this).attr(remoteTakerTag)).attr('actions', $(this).attr(remoteActionTag));
			}
		});
	});
});
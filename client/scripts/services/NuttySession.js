angular.module('nuttyapp')
	.factory('NuttySession', ['$rootScope', function($rootScope) {
		var SessionColl = new Meteor.Collection('nuttysession');
		var users = [];
		var sscursor;
		var ss = [];
		var masterid;
		var recordings = [];
		var NuttyRecordings = new Meteor.Collection('nuttyrecordings');
		window.NuttyRecordings = NuttyRecordings;
		var recordingscursor;
		window.SessionColl = SessionColl;
		window.users = users;
		window.ss = ss;

		$rootScope.$watch(function() {
			return masterid;
		}, function(newval) {
			if (newval && Session.get("desc")) {
				var desc = Session.get("desc");
				SessionColl.update({_id:masterid}, {$set: {desc: desc}});
			}
		});

		/* for some reason on load username was not being displayed */
		Meteor.startup(function(){
			setTimeout(function() {
				$rootScope.$apply();
			}, 1000);
		});

		function _userscursor (sessionid) {
			var userscursor = SessionColl.find({$or:[{type:"master"},{type:"slave"}], sessionid:sessionid});
			window.userscursor = userscursor;
			userscursor.observe({
				addedAt: function(doc,atIndex,before) {
					users[atIndex] = doc;
					if (doc.sessionid === sessionid && doc.type === "master") {
						window.masterid = masterid = doc._id;
						if (doc.desc)
							retobj.desc = doc.desc;
					}
	                safeApply($rootScope);
				},
				changedAt: function(newdoc, olddoc, atIndex) {
					users[atIndex] = newdoc;
					if (newdoc.type === "master")
						retobj.desc = newdoc.desc;
	                safeApply($rootScope);
				},
				removedAt: function(doc, atIndex) {
					users.splice(atIndex, 1);
					safeApply($rootScope);
				},
				movedTo: function(document, fromIndex, toIndex, before) {
					console.log("movedTo");
					console.log(fromIndex);
					console.log(toIndex);
					console.log(before);				
				}
			});
		}
		function observeSession(sessionid) {
			var session = SessionColl.find({type:"session", sessionid: sessionid});

			session.observe({
				addedAt: function(doc) {
					_.each(doc, function(value, key, list) {
						if (key === 'rowcol')
							retobj.rowcol = value;
						if (key === 'sessionid')
							retobj.sessionid = value;
						if (key === '_id')
							retobj.id = value;
						if (key === 'desc')
							retobj.desc = value;
						if (key === 'readonly')
							retobj.readonly = value;
					});
					safeApply($rootScope);
				},
				changedAt: function(newdoc, olddoc, atIndex) {
					_.each(newdoc, function(value, key, list) {
						if (key === 'rowcol')
							retobj.rowcol = value;
						if (key === 'sessionid')
							retobj.sessionid = value;
						if (key === '_id')
							retobj.id = value;
						if (key === 'desc')
							retobj.desc = value;
						if (key === 'readonly')
							retobj.readonly = value;
					});
					safeApply($rootScope);
				}
			});
		}

		var retobj = {
			type: "",
			id : undefined,
			sessionid : undefined,
			clientid: undefined,
			rowcol: {},
			desc: "",
			users: users,
			sharedsessions: ss,
			recordings: recordings,
			readonly: false,
			setmaster: function(sessionid, clientid) {
				this.type = "master";
				this.clientid = clientid;
				var sub = Meteor.subscribe('mastersession', sessionid, clientid);
				_userscursor(sessionid);
				observeSession(sessionid);
				Deps.autorun(function() {
					var ready = sub.ready();
					if (ready) {
                        var userid = Meteor.userId();
                        if (userid)
                            retobj.userloggedin();
                        else
                            retobj.userloggedout();
					}
				});
			},
			setslave: function(sessionid, clientid) {
				this.type = "slave";
				this.clientid = clientid;
				var sub = Meteor.subscribe('slavesession', sessionid, clientid);
				_userscursor(sessionid);
				observeSession(sessionid);
				Deps.autorun(function() {
					var ready = sub.ready();
					if (ready) {
                        var userid = Meteor.userId();
                        if (userid)
                            retobj.userloggedin();
                        else
                            retobj.userloggedout();
					}
				});
			},
			setreadonly: function(ro) {
				SessionColl.update({_id:this.id}, {$set: {readonly: ro}});
			},
			setrowcol: function(rc) {
				SessionColl.update({_id:this.id}, {$set: {rowcol: rc}});
			},
			userloggedin: function(cbk) {
				Meteor.call('userloggedin', retobj.sessionid, retobj.clientid, retobj.type, cbk);
			},
			userloggedout: function(cbk) {
				Meteor.call('userloggedout', retobj.sessionid, retobj.clientid, cbk);
			},
			setdesc: function(desc) {
				Session.set("desc", desc);
				SessionColl.update({_id:masterid}, {$set: {desc: desc}});
			},
			insertrecording: function(doc) {
				if (NuttyRecordings.find({owner: doc.owner, filename: doc.filename}).fetch().length === 0)
					NuttyRecordings.insert(doc);
			},
			deleterecording: function(_id) {
				NuttyRecordings.remove({_id:_id});
			}
		};

		window.NuttySession = retobj;
		var sessionssub;
		var recordingssub;
		Deps.autorun(function() {
			var user = Meteor.userId();
			if (user) {
				sessionssub = Meteor.subscribe('ownedsessions');
				sscursor = SessionColl.find({type:"master"});
				sscursor.observe({
					addedAt: function(doc,atIndex,before) {
						ss[atIndex] = doc;
						safeApply($rootScope);
					},
					changedAt: function(newdoc, olddoc, atIndex) {
						ss[atIndex] = newdoc;
						safeApply($rootScope);
					},
					removedAt: function(doc, atIndex) {
						ss.splice(atIndex, 1);
						safeApply($rootScope);
					},
					movedTo: function(document, fromIndex, toIndex, before) {
						console.log("movedTo");
						console.log(fromIndex);
						console.log(toIndex);
						console.log(before);				
					}
				});
				recordingssub = Meteor.subscribe('ownedrecordings');
				recordingscursor = NuttyRecordings.find({},{sort:{createdAt:-1}});
				recordingscursor.observe({
					addedAt: function(doc,atIndex,before) {
						console.log("addedAt");
						console.log(doc);
						console.log(atIndex);
						console.log(before);
						if (before) {
							recordings.unshift(doc);
						} else {
							recordings[atIndex] = doc;
						}
						recordings[atIndex].embedid = recordings[atIndex].filename.replace(/\./, '');
						safeApply($rootScope);
					},
					changedAt: function(newdoc, olddoc, atIndex) {
						console.log("changedAt");
						console.log(newdoc);
						console.log(olddoc);
						console.log(addedAt);
						recordings[atIndex] = newdoc;
						recordings[atIndex].embedid = recordings[atIndex].filename.replace(/\./, '');
						safeApply($rootScope);
					},
					removedAt: function(doc, atIndex) {
						console.log("removedAt");
						console.log(atIndex);
						recordings.splice(atIndex, 1);
						safeApply($rootScope);
					},
					movedTo: function(document, fromIndex, toIndex, before) {
						console.log("movedTo");
						console.log(fromIndex);
						console.log(toIndex);
						console.log(before);				
					}
				});
			} else {
				if (sessionssub)
					sessionssub.stop();
				if (recordingssub)
					recordingssub.stop();
				_.each(ss, function(elem, index) {
					delete ss[index];
				});
				_.compact(ss);

				_.each(recordings, function(elem, index) {
					delete recordings[index];
				});
				_.compact(recordings);

			}
		});

        var extid = "ooelecakcjobkpmbdnflfneaalbhejmk";
        window.paste = function (cbk) {
            chrome.runtime.sendMessage (extid, {paste: true}, cbk);
        };

        window.copy = function (msg) {
            chrome.runtime.sendMessage (extid, {copy: true, msg: msg});
        };
		return retobj;
	}]);

// when master session ends cleanup
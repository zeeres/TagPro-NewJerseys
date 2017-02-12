// ==UserScript==
// @name         TagPro NewJerseys
// @version      1.1.0
// @description  Set and change ball jerseys directly from the group page
// @author       zeeres
// @include      http://tagpro-*.koalabeast.com*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_log
// @updateURL    https://github.com/zeeres/TagPro-NewJerseys/raw/master/TagPro-NewJerseys.user.js
// @downloadURL  https://github.com/zeeres/TagPro-NewJerseys/raw/master/TagPro-NewJerseys.user.js
// ==/UserScript==

//==   This script is based on Some Ball -1's "TagPro Jerseys" script   ==\\

var spinJerseys = true;  // true or false

// Add your own imgur album links here inside quotes with commas between quoted album links
// For example: var customAlbums = ["http://imgur.com/a/0zBNw", "http://imgur.com/a/1abcD"]; (do not include comma if only 1 album)
// Images should have titles that match team names and a single digit numerical description that matches team color (0 for either/both, 1 for red, 2 for blue)
var Albums = ["https://imgur.com/a/tE24G", "https://imgur.com/a/fSicG", "https://imgur.com/a/yIgYZ"];

// Add your own imgur image links here inside quotes with commas between quoted image links, it must links to the png file
// For example: var customImages = ["http://i.imgur.com/17aAwABc.png", "http://i.imgur.com/abc123DEF.png"]; (do not include comma if only 1 image)
// Images should have titles that match team names and a single digit numerical description that matches team color (0 for either/both, 1 for red, 2 for blue)
// var Images = [];  // not implemented atm

var client_id = 'c638f51525edea6';  // don't steal my client-id. get your own very quickly from here: https://api.imgur.com/oauth2/addclient

var default_data = {stored: true, active: true, isPrivate: false, lastRedTeam: false, lastRedTeamName: 'Red', lastBlueTeam: false, lastBlueTeamName: 'Blue', leagues: [], showLeagues: [], known_teams: {}};  // default data

var debug = false;

function logd(message) {
    if (debug) console.log(message);
}

class Settings {
    constructor(data) {
        this.prefix = 'TPNJ_';
        if (GM_getValue(this.prefix+'stored') === undefined) {   // never stored values yet
            this.data = data;
            this.store_all();
        } else {
            this.data = {};
            for (var d in default_data) {
                this.data[d] = GM_getValue(this.prefix+d);
            }
        }
    }
    set(variable, value) {
        this.data[variable] = value;
        GM_setValue(this.prefix+variable, value);
        logd('have set ' + variable + ' to ' + value);
        logd('check ' + this.prefix + variable + ' was set to ' + GM_getValue(this.prefix+variable));
    }
    delete(variable) {
        delete this.data[variable];
        GM_deleteValue(this.prefix+variable);
    }
    get(variable, share_prefix) {
        share_prefix = share_prefix || false;
        var value = (share_prefix)?(JSON.parse(window.localStorage.getItem(share_prefix+variable))):GM_getValue(this.prefix+variable);
        logd((share_prefix)?(variable + ' (from localStorage) is:'):(variable + ' is:'));
        logd(value);
        var keys = Object.keys(default_data);
        var found = false;
        for(var i = 0; i < keys.length; i++) {
            if (keys[i] === variable) found = true;
        }
        if (value === undefined && !found) {
            this.set(variable, default_data[variable]);
            return default_data[variable];
        } else return value;
    }
    share(variable) {
        window.localStorage.setItem(this.prefix+variable, JSON.stringify(this.data[variable]));
    }
    store_all() {
        for (var d in this.data) {
            GM_setValue(this.prefix+d, this.data[d]);
        }
    }
    log_all() {
        for (var d in this.data) {
            console.log(d + ': ' + this.data[d]);
        }
    }
    delete_all() {
        for (var d in this.data) {
            GM_deleteValue(this.prefix+d);
        }
    }
}

function ObjectIndexOf(myArray, property, searchTerm) {  // searches for a property in a {}-object
    for(var i = 0, len = myArray.length; i < len; i++) {
        if (myArray[i][property] === searchTerm) return i;
    }
    return -1;
}


function ajax_read_albums() {
    for (var a = 0; a < Albums.length; a++) {
        var match = /([A-Za-z]+)\|([0-9])/;  // imgur description will be matched for this
        logd('Albums['+a+']: ' + Albums[a]);
        var id = Albums[a].match(/http[s]?:\/\/imgur\.com\/a\/(.+)[\/]?/)[1];  // [0] is the whole string, [1] only the matched group (.+);
        logd('id: ' + id);
        $.ajax({
            url: 'https://api.imgur.com/3/album/'+id+'/images',
            headers: {
                'Authorization': 'Client-ID '+client_id  // don't steal my client-id. get your own very quickly from here: https://api.imgur.com/oauth2/addclient
            },
            type: 'GET',
            success: function(ajax) {
                var data = settings.get('leagues');
                ajax.data.forEach(function(curr) {
                    if(curr.description && curr.title)
                    {
                        var descriptor = curr.description.match(match);
                        var league_index = ObjectIndexOf(data, "league", descriptor[1]);
                        if (league_index === -1)  // new league
                        {
                            data.push({"league": descriptor[1], "teams": []});
                            league_index = data.length-1;
                        }
                        var team_index = ObjectIndexOf(data[league_index].teams, "team", curr.title);
                        var jersey_type = parseInt(descriptor[2]);
                        var jersey = (jersey_type === 1)?'red':((jersey_type === 2)?'blue':'neutral');
                        if(team_index === -1)  // new team
                        {
                            data[league_index].teams.push({"team": curr.title, "jerseys": {}});
                            team_index = data[league_index].teams.length-1;
                        }
                        //logd('data:');
                        //logd(data);
                        //logd('league_index:');
                        //logd(league_index);
                        //logd('team_index:');
                        //logd(team_index);
                        data[league_index].teams[team_index].jerseys[jersey] = curr.id;
                    }
                });
                logd('ajax2 data: ');
                logd(data);
                settings.set('leagues', data);
            }
        });
    }
}

function inactive_hide() {
    $("#tpnj-ul").hide();
    $("#tpnj-header").css('background', '#54752d');
    $("label#tpnj-league").hide();
}

function create_html() {
    var data = settings.get('leagues');
    var $spectators = $('#spectators');
    $('<div id="tpnj" class="col-md-12 private-game"><div id="tpnj_group" class="player-group"><div id="tpnj-header" class="player-group-header" style="background: #8bc34a; color: #fff;"><div class="team-name">TagPro NewJerseys</div><div class="pull-right"><label class="btn btn-default" id="tpnj_switch"><input type="checkbox" name="tpnj_active"> active</label></div><div class="clearfix"></div></div><ul id="tpnj-ul" style="background: #353535; border-radius: 0 0 3px 3px; border: 1px solid #404040; border-top: 1px solid #2b2b2b; padding: 10px; overflow-y: auto;"><div id="redselect" class="col-md-6 private-game"></div><div id="blueselect" class="col-md-6 private-game"></div></ul></div></div>').insertBefore('#spectators');
    $('input[name="tpnj_active"]').prop('checked', settings.get('active'));
    $('input[name="tpnj_active"]').change(function() {
        settings.set('active', this.checked);
        if (this.checked) {
            settings.set('active', true);
            $("#tpnj-ul").show();
            $("#tpnj-header").css('background', '#8bc34a');
            $("label#tpnj-league").show();
            html_data();
        } else {
            settings.set('active', false);
            inactive_hide();
        }
    });

    var $playerGroup = $('#tpnj_group');
    var showLeagues = settings.get('showLeagues');
    logd('showLeagues:');
    logd(showLeagues);
    logd('data.length: ' + data.length);
    var ord = sort_data(),
        order = ord[0],
        order_teams = ord[1];
    //order = [0, 1, 2, 3, 4, 5];
    logd('ord:');
    logd(ord);
    for (var league = 0; league < order.length; league++) {  // button for each league
        $playerGroup.append('<label class="btn btn-default" id="tpnj-league"><input type="checkbox" name="tpnj_league_' + order[league] + '"> ' + data[order[league]].league + '</label>');
        if (showLeagues.indexOf(order[league]) !== -1) {
            $('input[name="tpnj_league_' + order[league] + '"]').prop('checked', true);
        }
        $('input[name="tpnj_league_' + order[league] + '"]').change(function() {
            var id = parseInt(this.name.match(/tpnj_league_([0-9]*)/)[1]);
            logd('change_id:' + id);
            var index = showLeagues.indexOf(id);
            logd('index: ' + index);
            if (this.checked) {
                if (index === -1) {
                    showLeagues.push(id);
                    settings.set('showLeagues', showLeagues);
                }
            } else {
                if (index !== -1) {
                    showLeagues.splice(index, 1);
                    settings.set('showLeagues', showLeagues);
                }
            }
            html_data();
        });
    }

    var $redselect = $('#redselect');
    $redselect.append('<select id="redTeamJerseys" class="form-control" style="width: 100%"><option value="none">Choose Jersey</option></select></br><div class="player-group small" style="text-align: center;"><img id="redjersey-preview" src=""></div>');
    $("#redjersey-preview").hide();
    $('#redTeamJerseys').on('change', function() {
        var val = $('option:selected', this).attr('value');
        settings.set('lastRedTeam', val, true);
        if (val !== 'none') {
            var d = val.split('.');
            var img = data[d[0]].teams[d[1]].jerseys[d[2]];
            $("#redjersey-preview").attr("src", "http://i.imgur.com/" + img + ".png").show();
            update_known_teams(val, 'red');
            html_data();
        } else $("#redjersey-preview").hide();
    });

    var $blueselect = $('#blueselect');
    $blueselect.append('<select id="blueTeamJerseys" class="form-control" style="width: 100%"><option value="none">Choose Jersey</option></select></br><div class="player-group small" style="text-align: center;"><img id="bluejersey-preview" src=""></div>');
    $("#bluejersey-preview").hide();
    $('#blueTeamJerseys').on('change', function() {
        var val = $('option:selected', this).attr('value');
        settings.set('lastBlueTeam', val, true);
        if (val !== 'none') {
            var d = val.split('.');
            var img = data[d[0]].teams[d[1]].jerseys[d[2]];
            $("#bluejersey-preview").attr("src", "http://i.imgur.com/" + img + ".png").show();
            update_known_teams(val, 'blue');
        } else $("#bluejersey-preview").hide();
    });
    if (!settings.get('active')) inactive_hide();
}

function update_known_teams(val, teamcolor) {
    var known_teams = settings.get('known_teams');
    var teamName = (teamcolor === 'red')?settings.get('redTeamName'):settings.get('blueTeamName');
    if (teamName !== 'Red' && teamName !== 'Blue') {
        known_teams[teamName] = val;
    }
    settings.set('known_teams', known_teams, true);
}

function convert_known_team(team_name, teamcolor) {  // convert known_team (teamname, not "ltj") to appropriate teamcolor ltj
    var ltj = settings.get('known_teams')[team_name];
    if (ltj === undefined) return false;  // if not found
    var d = ltj.split('.');
    var color = d[3];
    if (d[2] !== 'neutral') color = teamcolor;
    return d[0]+'.'+d[1]+'.'+color;
    // TODO: check if new ltj is available
}

function convert_ltj(ltj, teamcolor) {  // convert ltj to appropriate teamcolor ltj
    var d = ltj.split('.');
    var color = d[3];
    if (d[2] !== 'neutral') color = teamcolor;
    return d[0]+'.'+d[1]+'.'+color;
    // TODO: check if new ltj is available
}

function html_data() {
    var data = settings.get('leagues');
    $('#redTeamJerseys').children().remove();  // remove all teams from select box
    $('#blueTeamJerseys').children().remove();  // remove all teams from select box
    // add teams to select box again
    var showLeagues = settings.get('showLeagues');
    logd('showLeagues: ' + showLeagues);
    for (var l in showLeagues) {
        var li = showLeagues[l];
        var $groupRed = $('<optgroup label="'+data[li].league+'">');
        var $groupBlue = $('<optgroup label="'+data[li].league+'">');
        for(var t = 0; t < data[li].teams.length; t++)
        {
            var team = data[li].teams[t].team;
            var jerseys = data[li].teams[t].jerseys;
            var option = '';
            if (jerseys.red) $groupRed.append('<option value="'+li+'.'+t+'.red">'+team+'</option>');  // value format: "league_index.team_index.jersey_type
            if (jerseys.blue) $groupBlue.append('<option value="'+li+'.'+t+'.blue">'+team+'</option>');  // value format: "league_index.team_index.jersey_type
            if (jerseys.neutral) {
                $groupRed.append('<option value="'+li+'.'+t+'.neutral">'+team+' (n)</option>');  // value format: "league_index.team_index.jersey_type
                $groupBlue.append('<option value="'+li+'.'+t+'.neutral">'+team+' (n)</option>');  // value format: "league_index.team_index.jersey_type
            }
        }
        $('#redTeamJerseys')[0].add($groupRed[0]);
        $('#blueTeamJerseys')[0].add($groupBlue[0]);
    }

    var lastRedTeam = settings.get('lastRedTeam');
    var d, img;
    var known_teams = settings.get('known_teams');
    if(lastRedTeam) {
        $('#redTeamJerseys').val(lastRedTeam);
        d = lastRedTeam.split('.');
    } else {
        $('#redTeamJerseys').val(known_teams[settings.get('redTeamName')]);
    }
    if (d !== undefined) {  // if lastRedTeam is not of the format "league.team.jersey"
        img = data[d[0]].teams[d[1]].jerseys[d[2]];
        $("#redjersey-preview").attr("src", "http://i.imgur.com/" + img + ".png").show();
    }

    var db, imgb;
    var lastBlueTeam = settings.get('lastBlueTeam');
    if(lastBlueTeam) {
        $('#blueTeamJerseys').val(lastBlueTeam);
        db = lastBlueTeam.split('.');
    } else {
        $('#blueTeamJerseys').val(known_teams[settings.get('blueTeamName')]);
    }
    if (db !== undefined) {
        imgb = data[db[0]].teams[db[1]].jerseys[db[2]];
        $("#bluejersey-preview").attr("src", "http://i.imgur.com/" + imgb + ".png").show();
    }
}

function sort_data() {
    // sort data
    var data = settings.get('leagues');
    data.sort(function(a, b) {  // sort data by league name:
        var nameA = a.league.toUpperCase();
        var nameB = b.league.toUpperCase();
        return nameA.localeCompare(nameB);
    });
    for (var l = 0; l < data.length; l++) {  // sort teams in each league
        data[l].teams.sort(function(a, b) {
            var nameA = a.team.toUpperCase();
            var nameB = b.team.toUpperCase();
            return nameA.localeCompare(nameB);
        });
    }
    var sorted = data,
        order = [],
        order_teams = [];
    logd('sorted: ');
    logd(sorted);
    data = settings.get('leagues');
    for (var i = 0; i < sorted.length; i++) {
        var index = ObjectIndexOf(data, "league", sorted[i].league);
        logd('index:');
        logd(index);
        order.push(index);
        var order_team = [];
        for (var t = 0; t < sorted[i].teams.length; t++) {
            var index2 = ObjectIndexOf(data[index].teams, "team", sorted[i].teams[t]);
            order_team.push(index2);
        }
        order_teams.push(order_team);
    }
    logd('order:');
    logd(order);
    logd('order_teams:');
    logd(order_teams);
    return [order, order_teams];
}

var WhereAmI = function(){
    if (window.location.port) {
        return('game');
    } else if (window.location.pathname.startsWith('/groups/')) {
        return('group');
    } else {
        return('elsewhere');
    }
};

var IAmIn = WhereAmI();
var settings = new Settings(default_data);
//settings.delete_all();
//settings = new Settings();

if(IAmIn === 'group')  // group page
{
    var init = false;
    tagpro.group.socket.on('private',function(priv) {
        if (!priv.isPrivate) settings.set('isPrivate', false);
        if (priv.isPrivate && !init)
        {
            ajax_read_albums();
            settings.store_all();
            logd('asdf: ' + settings.get('leagues'));
            create_html();
            html_data();
            settings.set('isPrivate', true);
            init = true;
            tagpro.group.socket.on('setting',function(setting) {
                var data = settings.get('leagues');
                var known_teams = settings.get('known_teams');
                for (var t in known_teams) {
                    logd('t: ' + t);
                    if (known_teams.hasOwnProperty(t)) {
                        logd('known_teams[' + t + ']: ' + known_teams[t]);
                    }
                }
                var known_teams_ltj;
                if (setting.name === 'redTeamName') {
                    known_teams_ltj = known_teams[setting.value];
                    logd('known_teams_ltj red: ' + known_teams_ltj);
                    settings.set('redTeamName', setting.value);
                    if (setting.value !== 'Red' && known_teams_ltj) {
                        var ltjr = convert_known_team(setting.value, 'red');
                        if (ltjr) {
                            logd('convert_known_team red: ' + convert_known_team(setting.value, 'red'));
                            $('#redTeamJerseys').val(convert_known_team(setting.value, 'red'));
                            var d = ltjr.split('.');
                            if (d !== undefined) {  // if ltjr is not of the format "league.team.jersey"
                                var img = data[d[0]].teams[d[1]].jerseys[d[2]];
                                $("#redjersey-preview").attr("src", "http://i.imgur.com/" + img + ".png").show();
                                settings.set('lastRedTeam', ltjr, true);
                            }
                        }
                    }
                } else if (setting.name === 'blueTeamName') {
                    var redTeamName = settings.get('redTeamName'),
                        blueTeamName = settings.get('blueTeamName');
                    known_teams_ltj = settings.get('known_teams')[setting.value];
                    logd('known_teams_ltj blue: ' + known_teams_ltj);
                    settings.set('blueTeamName', setting.value);
                    if (setting.value !== 'Blue' && known_teams_ltj) {
                        var ltjb = convert_known_team(setting.value, 'blue');
                        if (ltjb) {
                            logd('convert_known_team blue: ' + ltjb);
                            $('#blueTeamJerseys').val(ltjb);
                            var db = ltjb.split('.');
                            if (db !== undefined) {  // if ltjb is not of the format "league.team.jersey"
                                var imgb = data[db[0]].teams[db[1]].jerseys[db[2]];
                                $("#bluejersey-preview").attr("src", "http://i.imgur.com/" + imgb + ".png").show();
                                settings.set('lastBlueTeam', ltjb, true);
                            }
                        }
                    } /* else if (setting.value === 'Blue' && blueTeamName === 'Blue') {  // if teams are switched (without custom names being set)
                        var ltj1 = convert_ltj($('#redTeamJerseys').val(), 'blue'),
                            ltj2 = convert_ltj($('#blueTeamJerseys').val(), 'red');
                        $('#redTeamJerseys').val(ltj2);
                        $('#blueTeamJerseys').val(ltj1);
                        var d2 = ltj2.split('.');
                        if (d2 !== undefined) {
                            var img2 = data[d2[0]].teams[d2[1]].jerseys[d2[2]];
                            $("#redjersey-preview").attr("src", "http://i.imgur.com/" + img2 + ".png").show();
                            settings.set('lastRedTeam', ltj2, true);
                        }
                        var d1 = ltj1.split('.');
                        if (d1 !== undefined) {
                            var img1 = data[d1[0]].teams[d1[1]].jerseys[d1[2]];
                            $("#bluejersey-preview").attr("src", "http://i.imgur.com/" + img1 + ".png").show();
                            settings.set('lastBlueTeam', ltj1, true);
                        }
                    }*/  // TODO: also triggers when refreshing/coming back from game, workaround?
                }
            });
        }
    });
}
else if (IAmIn === 'game') {  // ingame, draw jersey if there is one
    settings.share('leagues');
    settings.share('known_teams');
    settings.share('lastRedTeam');
    settings.share('lastBlueTeam');
    tagpro.ready(function() {
        if (tagpro.group.socket && settings.get('isPrivate') && settings.get('active'))  // if script is activated and group is private
        {
            var ltjr = settings.get('lastRedTeam');
            var ltjb = settings.get('lastBlueTeam');
            if ((ltjr && ltjr !== undefined) || (ltjb && ltjb !== undefined)) {  // one of red or blue is not false => at least one jersey was set
                var leagues = settings.get('leagues');
                var dr = ltjr.split('.'), db = ltjb.split('.');
                var imgr = leagues[dr[0]].teams[dr[1]].jerseys[dr[2]], imgb = leagues[db[0]].teams[db[1]].jerseys[db[2]];
                logd('dr:' + dr);
                logd('db:' + db);

                var tr = tagpro.renderer,
                    oldUPSP = tr.updatePlayerSpritePosition;

                tr.createJersey = function(player) {
                    var img = (player.team === 1)?imgr:imgb;
                    if(!img)  // make empty container if one team doesn't have a jersey
                    {
                        if(player.sprites.jersey) player.sprites.ball.removeChild(player.sprites.jersey);
                        player.sprites.jersey = new PIXI.DisplayObjectContainer();
                        player.sprites.jersey.team = player.team;
                        player.sprites.ball.addChildAt(player.sprites.jersey,1);
                    }
                    else
                    {
                        if(player.sprites.jersey) player.sprites.ball.removeChild(player.sprites.jersey);
                        player.sprites.jersey = new PIXI.Sprite(PIXI.Texture.fromImage('http://i.imgur.com/' + img + '.png'));
                        player.sprites.jersey.team = player.team;
                        player.sprites.ball.addChildAt(player.sprites.jersey, 1); // add on top of ball, below other stuff
                        player.sprites.jersey.anchor.x = 0.5;
                        player.sprites.jersey.anchor.y = 0.5;
                        player.sprites.jersey.x = 20;
                        player.sprites.jersey.y = 20;
                    }
                };
                tr.updatePlayerSpritePosition = function(player) {
                    if(!player.sprites.jersey) tr.createJersey(player);
                    if(player.sprites.jersey.team!==player.team) tr.createJersey(player);
                    var index = player.sprites.ball.getChildIndex(player.sprites.actualBall)+1;
                    if(index!==player.sprites.ball.getChildIndex(player.sprites.jersey)) player.sprites.ball.setChildIndex(player.sprites.jersey,index);
                    if(spinJerseys) player.sprites.jersey.rotation = player.angle;
                    oldUPSP(player);
                };
            }
        } else {  // if not in group, reset the last teams
            settings.set('lastRedTeam', false, true);
            settings.set('lastBlueTeam', false, true);
            settings.set('isPrivate', false);
        }
    });
}

/*!
 * jQuery Cookie Plugin v1.4.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD
		define(['jquery'], factory);
	} else if (typeof exports === 'object') {
		// CommonJS
		factory(require('jquery'));
	} else {
		// Browser globals
		factory(jQuery);
	}
}(function ($) {

	var pluses = /\+/g;

	function encode(s) {
		return config.raw ? s : encodeURIComponent(s);
	}

	function decode(s) {
		return config.raw ? s : decodeURIComponent(s);
	}

	function stringifyCookieValue(value) {
		return encode(config.json ? JSON.stringify(value) : String(value));
	}

	function parseCookieValue(s) {
		if (s.indexOf('"') === 0) {
			// This is a quoted cookie as according to RFC2068, unescape...
			s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
		}

		try {
			// Replace server-side written pluses with spaces.
			// If we can't decode the cookie, ignore it, it's unusable.
			// If we can't parse the cookie, ignore it, it's unusable.
			s = decodeURIComponent(s.replace(pluses, ' '));
			return config.json ? JSON.parse(s) : s;
		} catch(e) {}
	}

	function read(s, converter) {
		var value = config.raw ? s : parseCookieValue(s);
		return $.isFunction(converter) ? converter(value) : value;
	}

	var config = $.cookie = function (key, value, options) {

		// Write

		if (value !== undefined && !$.isFunction(value)) {
			options = $.extend({}, config.defaults, options);

			if (typeof options.expires === 'number') {
				var days = options.expires, t = options.expires = new Date();
				t.setTime(+t + days * 864e+5);
			}

			return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
				options.path    ? '; path=' + options.path : '',
				options.domain  ? '; domain=' + options.domain : '',
				options.secure  ? '; secure' : ''
			].join(''));
		}

		// Read

		var result = key ? undefined : {};

		// To prevent the for loop in the first place assign an empty array
		// in case there are no cookies at all. Also prevents odd result when
		// calling $.cookie().
		var cookies = document.cookie ? document.cookie.split('; ') : [];

		for (var i = 0, l = cookies.length; i < l; i++) {
			var parts = cookies[i].split('=');
			var name = decode(parts.shift());
			var cookie = parts.join('=');

			if (key && key === name) {
				// If second argument (value) is a function it's a converter...
				result = read(cookie, value);
				break;
			}

			// Prevent storing a cookie that we couldn't decode.
			if (!key && (cookie = read(cookie)) !== undefined) {
				result[name] = cookie;
			}
		}

		return result;
	};

	config.defaults = {};

	$.removeCookie = function (key, options) {
		if ($.cookie(key) === undefined) {
			return false;
		}

		// Must not alter options, thus extending a fresh object...
		$.cookie(key, '', $.extend({}, options, { expires: -1 }));
		return !$.cookie(key);
	};

}));


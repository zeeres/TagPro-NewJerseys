// ==UserScript==
// @name         TagPro NewJerseys
// @version      0.40
// @description  Set and change ball jerseys directly from the group page
// @author       Some Ball -1, zeeres
// @include      http://tagpro-*.koalabeast.com*
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

var spinJerseys = true; //true or false

// Add your own imgur album links here inside quotes with commas between quoted album links
// For example: var customAlbums = ["http://imgur.com/a/0zBNw", "http://imgur.com/a/1abcD"]; (do not include comma if only 1 album)
// Images should have titles that match team names and a single digit numerical description that matches team color (0 for either/both, 1 for red, 2 for blue)
var customAlbums = ["https://imgur.com/a/fSicG"];

// Add your own imgur image links here inside quotes with commas between quoted image links, it must links to the png file
// For example: var customImages = ["http://i.imgur.com/17aAwABc.png", "http://i.imgur.com/abc123DEF.png"]; (do not include comma if only 1 image)
// Images should have titles that match team names and a single digit numerical description that matches team color (0 for either/both, 1 for red, 2 for blue)
var customImages = [];

var WhereAmI = function(){
    if (window.location.port) {
        return('game');
    } else if (window.location.pathname.startsWith('/group')) {
        return('group');
    } else {
        return('elsewhere');
    }
};

var IAmIn = WhereAmI();


if(IAmIn === 'group') // group page
{
    var init = false;
    tagpro.group.socket.on('private',function(priv) {
        if(GM_getValue('groupId')!==location.pathname) //new group
        {
            GM_setValue('groupId',location.pathname);
            GM_setValue('fromGroup',false);
            GM_setValue('redJersey',false);
            GM_setValue('blueJersey',false);
        }
        if(priv.isPrivate && !init)
        {
            setup();
            init = true;
        }
    });
    function setup()
    {
        var $redTeam = $('#red-team'); //.find('.player-group-header');
        $redTeam.append('<select id="redTeamJerseys" class="form-control" style="width: 100%"><option value="none">Choose Jersey</option></select></br>'); 
        var $blueTeam = $('#blue-team'); //.find('.player-group-header');
        $blueTeam.append('<select id="blueTeamJerseys" class="form-control" style="width: 100%"><option value="none">Choose Jersey</option></select></br>');
        $('#redTeamJerseys').change(function() {GM_setValue('redJersey',$('#redTeamJerseys').val()==='none'?false:$('#redTeamJerseys').val());});
        $('#blueTeamJerseys').change(function() {GM_setValue('blueJersey',$('#blueTeamJerseys').val()==='none'?false:$('#blueTeamJerseys').val());});
        tagpro.group.socket.on('play',function() {
            GM_setValue('fromGroup',true);
        });
        tagpro.group.socket.on('private',function() {
            GM_setValue('fromGroup',false);
        });
        $('#joinButton').click(function() {
            GM_setValue('fromGroup',true);
        });
        $('#leaveButton').click(function() {
            GM_setValue('fromGroup',false);
            GM_setValue('redJersey',false);
            GM_setValue('blueJersey',false);
        });
        var jerseys = [[[]]], //league > team > jersey colors
            teams = [[]], //league > team
            leagues = [], //league
            match = /([A-Za-z]+)\|([0-9])/;  // imgur description will be matched for this

        $.ajax({
            url: 'https://api.imgur.com/3/album/tE24G/images',
            headers: {
                'Authorization': 'Client-ID c638f51525edea6' //don't steal my client-id. get your own very quickly from here: https://api.imgur.com/oauth2/addclient
            },
            type: 'GET',
            success: function(data) {
                data.data.forEach(function(curr) {
                    if(curr.description && curr.title)
                    {
                        var descriptor = curr.description.match(match),
                            league_index,
                            team_index;
                        if(leagues.indexOf(descriptor[1])===-1) //new league
                        {
                            leagues.push(descriptor[1]);
                            league_index = leagues.length-1;
                            teams[league_index] = [];
                            jerseys[league_index] = [[]];
                        } else {
                            league_index = leagues.indexOf(descriptor[1]);
                        }
                        if(teams[league_index].indexOf(curr.title)===-1) //new team
                        {
                            teams[league_index].push(curr.title);
                            team_index = teams[league_index].length-1;
                            jerseys[league_index][team_index] = [];
                            jerseys[league_index][team_index][parseInt(descriptor[2])] = curr.id;
                        } else {
                            jerseys[league_index][teams[league].indexOf(curr.title)][parseInt(descriptor[2])] = curr.id;
                        }
                    }
                });
                function nextAlbum(albumIndex)
                {
                    if(albumIndex<customAlbums.length)
                    {
                        var id = customAlbums[albumIndex].match(/http[s]?:\/\/imgur\.com\/a\/(.+)/);
                        ajaxAlbum(id[1],albumIndex+1);
                    }
                    else nextImage(0); //move on to custom images
                }
                function ajaxAlbum(id,nextIndex)
                {
                    $.ajax({
                        url: 'https://api.imgur.com/3/album/'+id+'/images',
                        headers: {
                            'Authorization': 'Client-ID c638f51525edea6' //don't steal my client-id. get your own very quickly from here: https://api.imgur.com/oauth2/addclient
                        },
                        type: 'GET',
                        success: function(data) {
                            data.data.forEach(function(curr) {
                                if(curr.title)
                                {
                                    var descriptor = curr.description.match(match),
                                        league_index,
                                        team_index;
                                    if (curr.description && descriptor)
                                    {
                                        if(leagues.indexOf(descriptor[1])===-1) //new league
                                        {
                                            leagues.push(descriptor[1]);
                                            league_index = leagues.length-1;
                                            teams[league_index] = [];
                                            jerseys[league_index] = [[]];
                                        } else {
                                            league_index = leagues.indexOf(descriptor[1]);
                                        }
                                    } else if(leagues.indexOf('Custom')===-1)
                                    {
                                        leagues.push('Custom');
                                        league_index = leagues.length-1;
                                        teams[league_index] = [];
                                        jerseys[league_index] = [[]];
                                    } else {
                                        league_index = leagues.indexOf('Custom');
                                    }

                                    if(teams[league_index].indexOf(curr.title)===-1)  //new team
                                    {
                                        teams[league_index].push(curr.title);
                                        team_index = teams[league_index].length-1;
                                        jerseys[league_index][team_index] = [];
                                        jerseys[league_index][team_index][descriptor?parseInt(descriptor[2]):0] = curr.id;
                                    } else {
                                        team_index = teams[league_index].indexOf(curr.title);
                                        jerseys[league_index][team_index][descriptor?parseInt(descriptor[2]):0] = curr.id;
                                    }
                                }
                            });
                            nextAlbum(nextIndex);
                        }
                    });
                }
                function nextImage(imageIndex)
                {
                    if(imageIndex<customImages.length)
                    {
                        var id = customImages[imageIndex].match(/http:\/\/i\.imgur\.com\/(.+)\.png/);
                        ajaxImage(id[1],imageIndex+1);
                    }
                    else sortAndAdd(); //move on to sorting
                }
                function ajaxImage(id,nextIndex)
                {
                    $.ajax({
                        url: 'https://api.imgur.com/3/image/'+id,
                        headers: {
                            'Authorization': 'Client-ID c638f51525edea6' //don't steal my client-id. get your own very quickly from here: https://api.imgur.com/oauth2/addclient
                        },
                        type: 'GET',
                        success: function(data) {
                            var curr = data.data;
                            if(curr.title)
                            {
                                var color = curr.description?curr.description.match(/\d/):0,
                                    league,
                                    team;
                                if(leagues.indexOf('Custom')===-1)
                                {
                                    leagues.push('Custom');
                                    league = leagues.length-1;
                                    teams[league] = [];
                                    jerseys[league] = [[]];
                                }
                                league = league || leagues.indexOf('Custom');
                                if(teams[league].indexOf(curr.title)===-1)
                                {
                                    teams[league].push(curr.title);
                                    team = teams[league].length-1;
                                    jerseys[league][team] = [];
                                }
                                jerseys[league][team || teams[league].indexOf(curr.title)][color?color:0] = curr.id;
                            }
                            nextImage(nextIndex);

                        }
                    });
                }
                nextAlbum(0); //begin with custom albums
            }
        });
        function sortAndAdd()
        {
            var toSortLeagues = [],
                toSortTeams = [],
                haveCustom = leagues.indexOf('Custom')>-1?1:0;

            for(var i = 0;i < leagues.length;i++)
            {
                toSortTeams = [];
                for(var j = 0;j < teams[i].length;j++)
                {
                    toSortTeams.push([teams[i][j],jerseys[i][j]]);
                }
                toSortTeams.sort(function(a,b) {
                    if(a[0].toUpperCase()>b[0].toUpperCase()) return 1; //regular alphabetical sort, ignore case
                    if(a[0].toUpperCase()<b[0].toUpperCase()) return -1;
                    if(a[0]>b[0]) return 1; //sort with case if otherwise identical
                    if(a[0]<b[0]) return -1;
                    return 0;
                });
                for(var j = 0;j < toSortTeams.length;j++)
                {
                    teams[i][j] = toSortTeams[j][0];
                    jerseys[i][j] = toSortTeams[j][1];
                }
                if(!haveCustom || (haveCustom && i<leagues.length-1)) //ignore 'Custom' league for sorting
                {
                    toSortLeagues.push([leagues[i],teams[i],jerseys[i]]);
                }
            }
            toSortLeagues.sort(function(a,b) {
                if(a[0].toUpperCase()>b[0].toUpperCase()) return 1;
                if(a[0].toUpperCase()<b[0].toUpperCase()) return -1;
                if(a[0]>b[0]) return 1;
                if(a[0]<b[0]) return -1;
                return 0;
            });
            if(haveCustom)
            {
                toSortLeagues.push([leagues[leagues.length-1],teams[teams.length-1],jerseys[jerseys.length-1]]); //add 'Custom' back at end of list
            }

            for(var i = 0;i < toSortLeagues.length;i++)
            {
                leagues[i] = toSortLeagues[i][0];
                teams[i] = toSortLeagues[i][1];
                jerseys[i] = toSortLeagues[i][2];
                var groupRed = $('<optgroup label="'+leagues[i]+'">');
                var groupBlue = $('<optgroup label="'+leagues[i]+'">');
                for(var j = 0;j < teams[i].length;j++)
                {
                    var team = jerseys[i][j],
                        toAppend;
                    if(team[1]) toAppend = team[1];
                    else if(team[0] && team.length > 0) toAppend = team[0];
                    toAppend = $('<option value="'+toAppend+'">'+teams[i][j]+'</option>');
                    groupRed.append(toAppend);
                    if(team[2]) toAppend = team[2];
                    else if(team[0] && team.length > 0) toAppend = team[0];
                    toAppend = $('<option value="'+toAppend+'">'+teams[i][j]+'</option>');
                    groupBlue.append(toAppend);
                }
                $('#redTeamJerseys')[0].add(groupRed[0]);
                $('#blueTeamJerseys')[0].add(groupBlue[0]);
            }
            if(GM_getValue('redJersey')) $('#redTeamJerseys').val(GM_getValue('redJersey'));
            if(GM_getValue('blueJersey')) $('#blueTeamJerseys').val(GM_getValue('blueJersey'));
        }
    }
}
else if (IAmIn === 'game') { // ingame, draw jersey if there is one
    tagpro.ready(function() {
        if(!tagpro.group.socket || !GM_getValue('fromGroup'))
        {
            GM_setValue('fromGroup',false);
            GM_setValue('redJersey',false);
            GM_setValue('blueJersey',false);
        }
        else if(GM_getValue('redJersey') || GM_getValue('blueJersey'))
        {
            var red = GM_getValue('redJersey');
            var blue = GM_getValue('blueJersey');
            var jersey = [red==='none'?false:red,blue==='none'?false:blue]; //incase 'none' somehow makes it through
            if(jersey[0] || jersey[1])
            {
                var tr = tagpro.renderer,
                    oldUPSP = tr.updatePlayerSpritePosition;

                tr.createJersey = function(player) {
                    if(!jersey[player.team-1]) //make empty container if one team doesn't have a jersey
                    {
                        if(player.sprites.jersey) player.sprites.ball.removeChild(player.sprites.jersey);
                        player.sprites.jersey = new PIXI.DisplayObjectContainer();
                        player.sprites.jersey.team = player.team;
                        player.sprites.ball.addChildAt(player.sprites.jersey,1);
                    }
                    else
                    {
                        if(player.sprites.jersey) player.sprites.ball.removeChild(player.sprites.jersey);
                        player.sprites.jersey = new PIXI.Sprite(PIXI.Texture.fromImage('http://i.imgur.com/'+jersey[player.team-1]+'.png'));
                        player.sprites.jersey.team = player.team;
                        player.sprites.ball.addChildAt(player.sprites.jersey,1); //add on top of ball, below other stuff
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
            tagpro.socket.on('end',function() {
                GM_setValue('fromGroup',false);
            });
        }
    });
} 

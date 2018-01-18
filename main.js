Array.prototype.last = function () {
    return this[this.length - 1];
}

function add(a, b) {
    return a + b;
}

var dialogoverlay = document.createElement('div');
dialogoverlay.id = 'dialogoverlay';

var dialogboxtemplate = document.createElement('div');
dialogboxtemplate.id = 'dialogbox';

var dialogbox = null;

function cleardialog() {
    if (document.body.contains(dialogoverlay)) {
        document.body.removeChild(dialogoverlay);
    }
}

function makedialog() {
    // place the overlay if it was not already present
    if (!document.body.contains(dialogoverlay)) {
        document.body.appendChild(dialogoverlay);
    }

    if (dialogbox && dialogoverlay.contains(dialogbox)) {
        var newdialogbox = dialogboxtemplate.cloneNode(false);
        dialogoverlay.replaceChild(newdialogbox, dialogbox);
        dialogbox = newdialogbox;
    }
    else {
        dialogbox = dialogboxtemplate.cloneNode(false);
        dialogoverlay.appendChild(dialogbox);
    }

    return dialogbox;
}

var colordepth = 8;
var shadelevelmax = (1 << colordepth) - 1;

function shadecount(shadestep) {
    return Math.floor(shadelevelmax / shadestep) + 1;
}

function grayshade2csscolor(shade) {
    return 'rgb(' + Array(3).fill(shade.toString()).join() + ')';
}

function preparetest(shadegroups, round, totalscore) {

    // Filter out the shadegroups with just one shade
    shadegroups = shadegroups.filter(function (shadegroup) {
        return shadegroup.length > 1;
    });

    /*
    Here on, we shall prepare the testcontrols.
    */

    var testcontrols = document.getElementById('testcontrols');
    testcontrols.innerHTML = '';

    // Test progress
    var rounddisplay = document.createElement('div');
    var roundprogressdisplay = document.createElement('div');

    var roundtext = document.createElement('div');
    var roundprogresstext = document.createElement('div');

    roundtext.className = 'testcontroltext';
    roundprogresstext.className = 'testcontroltext';

    roundtext.innerHTML = `Round&nbsp;${round}`;

    rounddisplay.appendChild(roundtext);
    roundprogressdisplay.appendChild(roundprogresstext);

    // Append test controls
    testcontrols.appendChild(rounddisplay);
    testcontrols.appendChild(roundprogressdisplay);

    /*
    Here on, we shall prepare the testbands.
    */

    var testbody = document.getElementById('testbody');
    testbody.innerHTML = '';

    var falsedelims = Array();
    var truedelims = Array();

    function makebandgroup(shadegroup) {

        var bandgroup = document.createElement('div');
        bandgroup.className = 'testbandgroup';

        function makeband(shade) {
            var band = document.createElement('div');
            band.className = 'testband';
            band.style['background-color'] = grayshade2csscolor(shade);
            bandgroup.appendChild(band);
        }

        function makedelim(delimindeed, shadeafter) {
            function delimonclicked(event) {
                var adelim = event.currentTarget;
                adelim.selected = !adelim.selected;
                adelim.classList.toggle('delimselected');

                updateroundprogresstext();
            }

            var delim = document.createElement('div');
            delim.className = 'delim';
            delim.shadeafter = shadeafter;

            delim.selected = false;
            delim.onclick = delimonclicked;

            bandgroup.appendChild(delim);

            if (delimindeed) {
                truedelims.push(delim);
            }
            else {
                // delim.click();
                falsedelims.push(delim);
            }
        }

        if (shadegroup.length) {
            makeband(shadegroup[0]);

            for (var shadeX = 0; ; ) {
                var delimindeed = Math.random() < 0.5;
                if (delimindeed) shadeX++;

                if (shadeX >= shadegroup.length) break;

                makedelim(delimindeed, shadegroup[shadeX]);
                makeband(shadegroup[shadeX]);
            }
        }

        testbody.appendChild(bandgroup);
    }

    function makegroupdelim() {
        var groupdelim = document.createElement('div');
        groupdelim.className = 'groupdelim';

        testbody.appendChild(groupdelim);
    }

    if (shadegroups.length) {
        makebandgroup(shadegroups[0]);

        for (var shadegroupX = 1; shadegroupX < shadegroups.length; shadegroupX++) {
            makegroupdelim();
            makebandgroup(shadegroups[shadegroupX]);
        }
    }

    window.scrollTo(0, 0);

    function updateroundprogresstext() {
        function oneifdelimselected (delim) {
            return delim.selected ? 1 : 0;
        }

        var selectedcount = falsedelims.map(oneifdelimselected).reduce(add, 0) + truedelims.map(oneifdelimselected).reduce(add, 0);
        var truecount = truedelims.length;

        roundprogresstext.innerHTML = `${selectedcount}&nbsp;/&nbsp;${truecount} splits`;
    }

    updateroundprogresstext();

    function evaluatetest() {
        var hitcount = 0;
        var avoidcount = 0;

        truedelims.forEach(function (delim) {
            if (delim.selected) {
                hitcount++;

                function sliceshadegroups() {
                    for (var shadegroupX = 0; shadegroupX < shadegroups.length; shadegroupX++) {
                        var shadegroup = shadegroups[shadegroupX];

                        // It cannot be that the 0th shade is the shadeafter of delim
                        for (var shadeX = 1; shadeX < shadegroup.length; shadeX++) {
                            if (shadegroup[shadeX] == delim.shadeafter) {
                                var slice1 = shadegroup.slice(0, shadeX);
                                var slice2 = shadegroup.slice(shadeX);

                                shadegroups.splice(shadegroupX, 1, slice1, slice2);

                                return;
                            }
                        }
                    }
                }

                sliceshadegroups();
            }
            else {
                delim.classList.add('falselymissed');
            }

            delim.onclick = null;
        });

        falsedelims.forEach(function (delim) {
            if (delim.selected) {
                delim.classList.add('falselyhit');
            }
            else {
                avoidcount++;
            }

            delim.onclick = null;
        });

        var hitrate = hitcount / truedelims.length;
        var avoidrate = avoidcount / falsedelims.length;

        var hitratedisplay = document.createElement('div');
        var avoidratedisplay = document.createElement('div');

        var hitratetext = document.createElement('div');
        var avoidratetext = document.createElement('div');

        hitratetext.className = 'testcontroltext';
        avoidratetext.className = 'testcontroltext';

        hitratetext.innerHTML = `${hitcount}&nbsp;/&nbsp;${truedelims.length} hit`;
        avoidratetext.innerHTML = `${avoidcount}&nbsp;/&nbsp;${falsedelims.length} avoided`;

        hitratedisplay.appendChild(hitratetext);
        avoidratedisplay.appendChild(avoidratetext);


        var roundscore = (hitrate + avoidrate) / 2;
        var score = roundscore / Math.pow(10, round - 1);

        totalscore += score;

        var roundscoredisplay = document.createElement('div');
        var totalscoredisplay = document.createElement('div');

        var roundscoretext = document.createElement('div');
        var totalscoretext = document.createElement('div');

        roundscoretext.className = 'testcontroltext';
        totalscoretext.className = 'testcontroltext';

        function decimaltopercentagetext(decimal) {
            return `${(decimal * 100).toFixed(2)}%`;
        }

        roundscoretext.innerHTML = `Round&nbsp;score: ${decimaltopercentagetext(roundscore)}`;
        totalscoretext.innerHTML = `Total&nbsp;score: ${decimaltopercentagetext(totalscore)}`;

        roundscoredisplay.appendChild(roundscoretext);
        totalscoredisplay.appendChild(totalscoretext);


        var continuesubmitdisplay = document.createElement('div');
        continuesubmitdisplay.className = 'submitcontrol';

        var continuesubmittext = document.createElement('div');
        continuesubmittext.className = 'testcontroltext';

        continuesubmittext.innerHTML = 'Next round?';
        continuesubmitdisplay.appendChild(continuesubmittext);

        continuesubmitdisplay.onclick = function (event) {
            preparetest(shadegroups, round + 1, totalscore);
        }


        // Empty out the testcontrols
        testcontrols.innerHTML = '';

        // Fill with the new ones
        testcontrols.appendChild(hitratedisplay);
        testcontrols.appendChild(avoidratedisplay);
        testcontrols.appendChild(roundscoredisplay);
        testcontrols.appendChild(totalscoredisplay);
        testcontrols.appendChild(continuesubmitdisplay);
    }

    /*
    Here on, we shall continue preparing the testcontrols.
    */

    // Test submit
    var roundsubmitdisplay = document.createElement('div');
    roundsubmitdisplay.className = 'submitcontrol';

    var roundsubmittext = document.createElement('div');
    roundsubmittext.className = 'testcontroltext';

    roundsubmittext.innerHTML = 'That\'s all?';
    roundsubmitdisplay.appendChild(roundsubmittext);

    roundsubmitdisplay.onclick = function (event) {

        var dialogbox = makedialog();

        // dialogbox question

        var question = document.createTextNode('Are you sure that you\'re done?');

        // dialogbox confirm

        var confirm = document.createElement('div');
        confirm.className = 'dialogsubmit dialogsubmitenabled';
        confirm.onclick = function (event) {
            cleardialog();
            evaluatetest();
        };
        confirm.innerHTML = 'Yes';

        // dialogbox deny

        var deny = document.createElement('div');
        deny.className = 'dialogsubmit dialogsubmitenabled';
        deny.onclick = function (event) {
            cleardialog();
        };
        deny.innerHTML = 'Let me rethink';


        // populate dialogbox

        dialogbox.appendChild(question);
        dialogbox.appendChild(confirm);
        dialogbox.appendChild(deny);
    }

    // Append test controls
    testcontrols.appendChild(roundsubmitdisplay);
}

function prepareshades(shadestep) {
    var shcount = shadecount(shadestep);

    var shadespan = (shcount - 1) * shadestep;
    var minshade = Math.floor((shadelevelmax - shadespan) / 2);

    var shades = Array(shcount);
    for (var i = 0; i < shcount; i++) {
        shades[i] = minshade + i * shadestep;
    }

    preparetest([shades], 1, 0);
}

function askfordifficulty() {

    var dialogbox = makedialog();

    // dialogbox question

    var question = document.createTextNode('How hard would you like to have your test?');

    // dialogbox options

    var options = document.createElement('div');
    options.className = 'dialogoptions';

    var optiontemplate = document.createElement('div');
    optiontemplate.className = 'dialogoption';
    dialogbox.option = null;

    for (var shadestep = 1; shadestep < 21; shadestep++) {
        var option = optiontemplate.cloneNode(false);
        
        option.innerHTML = `${shadestep}&nbsp;increment (${shadecount(shadestep)}&nbsp;shades)`;
        option.shadestep = shadestep;

        option.onclick = function (event) {
            if (dialogbox.option) {
                dialogbox.option.classList.remove('dialogoptionselected');
            }

            event.currentTarget.classList.add('dialogoptionselected');
            dialogbox.option = event.currentTarget;

            submit.classList.add('dialogsubmitenabled', 'dialogsubmitglowing');
        };

        options.appendChild(option);
    }

    // dialogbox submit

    var submit = document.createElement('div');
    submit.className = 'dialogsubmit';
    submit.onclick = function (event) {
        if (event.currentTarget.classList.contains('dialogsubmitenabled')) {
            var shadestep = dialogbox.option.shadestep;

            cleardialog();
            prepareshades(shadestep);
        }
    };
    submit.innerHTML = 'Continue';

    // populate dialogbox

    dialogbox.appendChild(question);
    dialogbox.appendChild(options);
    dialogbox.appendChild(submit);
}

function main() {
    askfordifficulty();
}

document.body.onload = main;
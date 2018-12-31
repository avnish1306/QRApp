module.exports = function(app, passport) {
    var QRcode = require('./models/qrcode');
    var base64image = require('base64-to-image');

    var path = './public/';
    const qrcode = require('qrcode');


    async function run(code) {
        var k = code.toString();
        const res = await qrcode.toDataURL(k);
        ////console.log(" result " + res);
        var qrObj = { 'fileName': code, 'type': 'png' };
        var imageInfo = base64image(res, path, qrObj);
        //console.log("image info " + imageInfo);
        if (imageInfo != null) {
            return true;
        } else {
            return false;
        }
    }
    app.get('/genQr', (req, res) => {
        run(1234).catch(error => console.log("error"));
        res.status(200).json({
            'status': 'true'
        });
    })

    // normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', isLoggedIn2, function(req, res) {
        res.render('index.ejs', { messagel: req.flash('loginMessage'), messages: req.flash('signupMessage') });

    });

    //user form route ===============================================================
    app.get("/user_form",function(req,res){
        res.render("user_form.ejs");
    })

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        var hero = req.user.isHero;
        if (hero == true) {
            res.redirect('/adminDashboard');
        } else {

            var id = null,
                email;
            var idStatus = req.user.idStatus;
            if (idStatus == false) {
                if (req.user.google != null) {
                    id = req.user.google.id;
                    email = req.user.google.email;
                } else if (req.user.facebook != null) {
                    id = req.user.facebook.id;
                    email = req.user.facebook.email;
                }
                if (id != null) {

                    var obj = req.user;
                    obj.idStatus = true;
                    obj.userId = id;
                    obj.qrcode = id;
                    obj.save((err, obj) => {
                        if (err)
                            console.log(" error in saving " + err);
                        //console.log("saving " + obj);
                        var Qr = new QRcode();
                        Qr.email = email;
                        Qr.code = id;
                        Qr.fileName = id + '.png';
                        Qr.balance = 0;
                        var curDate = new Date();
                        var history = { 'date': curDate, 'description': "QR genetared" };
                        Qr.history.push(history);

                        Qr.save((err, Qr) => {
                            if (err)
                                console.log(" error in saving " + err);
                            run(id).catch(e => { console.log("error in qrcode function") })
                        })


                    })
                }
            }


            res.render('profile.ejs', {
                user: req.user,

            });
        }
    });

    /*app.get('/:img', (req, res) => {
        var path = './' + req.params.img;
        res.sendFile(path, (err) => {
            if (err) {
                console.log(err);
            }
        })
    })*/
    app.get('/getQRdetails/:code', (req, res) => {
            var QRId = req.params.code;
            console.log(QRId);
            QRcode.findOne({ "code": QRId }, (err, qrcode) => {
                if (err) {

                    console.log(" erroer qr not found");
                    res.status(200).json({
                        'success': flase
                    });
                } else {
                    var resObj = {
                        'email': qrcode.email,
                        'balance': qrcode.balance,
                        'history': qrcode.history
                    }
                    res.status(200).json({
                        'success': true,
                        'qrcode': resObj
                    });
                }

            })
        })
        // Events SECTION =========================
    app.get('/events', isLoggedIn, function(req, res) {
        console.log(" event user: " + req.user);
        var img1 = req.user.userId.toString();
        img1 = img1 + ".png";
        res.render('events.ejs', {
            user: req.user,
            img: img1
        });
    });

    app.get('/scanner', /*isLoggedIn,*/ function(req, res) {
        console.log(" event user: " + req.user);
        res.render('scanner.ejs', {
            user: req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    // =============================================================================
    // AUTHENTICATE (FIRST LOGIN) ==================================================
    // =============================================================================

    // locally --------------------------------
    // LOGIN ===============================
    // show the login form
    // app.get('/login', function(req, res) {
    //     res.render('login.ejs', { message: req.flash('loginMessage') });
    // });

    // process the login form
    app.get('/login', isLoggedIn1, (req, res) => {
        res.redirect('/profile');
    });

    // SIGNUP =================================
    // show the signup form
    // app.get('/signup', function(req, res) {`
    //     res.render('signup.ejs', { message: req.flash('signupMessage') });
    // });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['public_profile', 'email'] }));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/auth/twitter', passport.authenticate('twitter', { scope: 'email' }));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


    // google ---------------------------------
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
    // send to google to do the authentication
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/user_form',
            failureRedirect: '/'
        }));

    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // locally --------------------------------
    app.get('/connect/local', function(req, res) {
        res.render('connect-local.ejs', { message: req.flash('loginMessage') });
    });
    app.post('/connect/local', passport.authenticate('local-signup', {
        successRedirect: '/profile', // redirect to the secure profile section
        failureRedirect: '/connect/local', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope: ['public_profile', 'email'] }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
        passport.authorize('facebook', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', { scope: 'email' }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
        passport.authorize('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email'] }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        }));

    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // used to unlink accounts. for social accounts, just remove the token
    // for local account, remove email and password
    // user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

function isLoggedIn1(req, res, next) {
    if (req.user) {
        //console.log(" islogged in  state " + req.user);
        next();
    } else {
        //console.log(" islogged in else  state" + req.user);
        res.redirect('/');
    }
}
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.user) {
        /*if (res.user.isHero == true) {
            res.redirect('/adminDashboard');
        } else {
            next();
        }*/
        console.log(" islogged in " + req.user.isHero);
        next();
    } else {
        //console.log(" islogged in else " + req.user);
        res.redirect('/login');
    }
}

function isLoggedIn2(req, res, next) {
    if (req.user) {
        //console.log(" islogged in " + req.user);
        res.redirect('/profile');

    } else {
        //console.log(" islogged in else " + req.user);
        next();
    }
}
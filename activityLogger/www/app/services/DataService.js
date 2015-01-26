'use-strict';

angular.module('ActivityLogger').factory('DataService',
    function ($firebase, FIREBASE_URL, $timeout, $q, $ionicPopup, $state,User,Activity) {

        var rootRef = new Firebase(FIREBASE_URL);
        var usersRef = rootRef.child('users');
        var all_Users_activitiesRef = rootRef.child('all_Users_activities');
        var competitionsRef = rootRef.child('competitions');

        // AngularFire wrapper
        var usersRefAngular = $firebase(usersRef);
        var all_Users_activitiesRefAngular = $firebase(all_Users_activitiesRef);
        var competitionsRefAngular = $firebase(competitionsRef);


//Private method
        /**
         * get usersdata stored in local
         * @return {Object of usersdata|empty array if user has no profil*}
         */
        function getUserLocal() {
            var leer= new User("","","","","","","");
            var user = localStorage.getItem('user');
            return user?JSON.parse(user):leer;
        }

        /**
         * get all activities of a user saved in local
         * @return {Object of activities saved local|empty array if no activty *}
         */
        function getAllActivitiesLocal() {
            var leer = new Activity("","","","","",[],"","","");
            var activities = localStorage.getItem('activities');
            return activities?JSON.parse(activities):leer;
        }


        function getAllCompetitions_firebase() {
            return competitionsRefAngular.$asArray();
        }

        function getAllActivities_firebase() {
            return all_Users_activitiesRefAngular.$asArray();


        }

        function saveUserId_Local(user) {
            var timer = $timeout(function () {
                var users = getAllUsers();
                var f_user;
                for (var i = 0; i < users.length; i++) {
                    f_user = users[i];
                    if (equal(f_user, user)) {
                        localStorage.setItem('userId', f_user.$id);//Store usersid that was generated by firebase
                        break;
                    }
                }
            }, 4 * 60); //wait 4 seconds
        }

        function equal(user1,user2) {
            return user1.usersName == user2.usersName;
        }

        function getFirebaseId(userId, id) {
            var allfirebaseActty = getAllActivities_firebase();
            for (var i = 0; i < allfirebaseActty.length; i++) {
                var f_activty = allfirebaseActty[i];
                if ((f_activty.userId == userId) && (f_activty.id == id)) {
                    return f_activty.$id;
                }
            }
            return id;
        }

        function showErrorMess(mess) {
            $ionicPopup.alert({
                title: 'Fehler',
                template: mess,
                buttons: [{
                    text: 'Schließen',
                    type: 'button-positive'
                }]
            });
        }

//Public method
        /*************************Users*******************************************/
        /**
         * get all Users stored in firebase
         * @return {*}
         */
        function getAllUsers() {
            return usersRefAngular.$asArray();
        }

        /**
         *  add and store user only local or local and in firebase
         * @param user
         * show exception message if Usersname already exist
         */
        function addUser(user) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            var userId = localStorage.getItem('userId');
            var fconnect=false;
            if ((firebaseConnected) && (!userId)) {  //Add User on firebase if not have been.
                var users = getAllUsers();
                var timer = $timeout(function () {
                    alert(users.length);
                    var hasUser = false;
                    for (var i = 0; i < users.length; i++) {
                        var userf = users[i];
                        if (userf.usersName == user.usersName) {
                            hasUser = true;
                            break;
                        }
                    }
                    if (hasUser) {
                       // throw "BenutzerName schon Vegeben";
                        showErrorMess("BenutzerName schon Vegeben");
                    } else {
                        fconnect = true;

                        getAllUsers().$add(user);
                        localStorage.setItem('user', JSON.stringify(user));
                        localStorage.setItem('infirebaseSaved', 'true');
                        saveUserId_Local(user);
                        var users_ref2 = getAllUsers();
                        timer=$timeout(function(user){
                            var userId=getCurrentUserId();
                            var user=getUserByID(userId);
                            user.id=userId;
                            users_ref2.$save(user);
                            localStorage.setItem('user', JSON.stringify(user));
                        },4*60)

                    }
                }, 8* 60)

            }else{
                localStorage.setItem('user', JSON.stringify(user));
            }
        }

        /**
         * update user only local or local and in firebase
         * @param user
         * show exception message if a firebase registered users want to update his profil but now he is not connecting.
         */
        function updateUser(user) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            var userId = localStorage.getItem('userId');

            if (firebaseConnected && userId) {
                getAllUsers().$save(user);
                localStorage.setItem('user', JSON.stringify(user));
            } else {
                if (!userId) {//Profil local update if have not been added in firebase
                    localStorage.setItem('user', JSON.stringify(user));
                } else {//firebaseConnected==false
                    showErrorMess("Um Ihre Profil zu ändern müssen Sie sich mit Firebase verbinden ");
                }
                if (firebaseConnected && !userId) {
                    addUser(user);  //kann happen when usersname already used and user decide to change it.
                }
            }
        }

        /**
         *  get user by id stored local or in firebase
         * @param id: usersid
         * @return {user| null if the key is not found }
         */
        function getUserByID(id) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            if ((id && id != null) && firebaseConnected) {
                return getAllUsers().$getRecord(id);
            } else {
                return getUserLocal();
            }

        }

        /**
         * get id of the current user
         * @return {user id| null if id not exist}
         */
        function getCurrentUserId() {
            var userId = localStorage.getItem('userId');
            return userId?userId:null;
        }

        /**
         * remove user from firebase
         * @param id
         */
        function removeUser(id) {
            getAllUsers().$remove(getUserByID(id));
        }

        /************************************Activities*******************************************/
        /**
         * Add and store activity Activity only local or local and in firebase.
         * @param activity
         * @throws exception if a user is connect to firebase and wants to store activities  without registration
         */
        function addActivity(activity) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            var userId = localStorage.getItem('userId');
            var activities = getAllActivitiesLocal();
            var nexid = localStorage.getItem('nextActivityId');

            if (!nexid) {
                nexid = 1;
            } else {
                nexid = parseInt(nexid);
            }
            if (activities != null) {
                activity.id = nexid;
                activities.push(activity);
            } else {
                activities = [];
                activity.id = nexid;
                activities.push(activity);
            }
            localStorage.setItem('activities', JSON.stringify(activities));
            localStorage.setItem('nextActivityId', parseInt(nexid) + 1);

            if (firebaseConnected) { //Add activity in firebase, and to to a list on Activities saved on firebase(activities_firebase)
                alert(" persit on firebase ...");
                if (userId != null) {
                    var activities_firebase = localStorage.getItem('activities_firebase'); // Activities saved on firebase.
                    var next_af_id = localStorage.getItem('next_af_id');//next Activity id saved on firebase

                    if (!next_af_id) {
                        next_af_id = 1;
                    } else {
                        next_af_id = parseInt(next_af_id);
                    }
                    if (activities_firebase) {
                        activity.id = next_af_id;
                        activities_firebase = JSON.parse(activities_firebase);
                        activities_firebase.push(activity);
                    } else {
                        activities_firebase = [];
                        activity.id = next_af_id;
                        activities_firebase.push(activity);
                    }
                    activity.userId = userId;
                    getAllActivities_firebase().$add(activity);
                    localStorage.setItem('activities_firebase', JSON.stringify(activities_firebase));
                    localStorage.setItem('next_af_id', parseInt(next_af_id) + 1);
                } else {
                    // to firebase connectect and don't have a Profil-> can´t add Activities
                    showErrorMess("Sie müssen ein Profil in Firebase  anlegen um Ihre Aktivität speichert zu können !");

                }
            }
        }

        /**
         * get all activities of a user
         * @param user_id: usersid
         * @return { Array of all usersactivties|empty array}
         */
        function getAllActivities(user_id) {
            var all_activitiesByUserID = [];
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            if (user_id && firebaseConnected) {
                var all_user_activities = getAllActivities_firebase();
                for (var i = 0; i < all_user_activities.length; i++) {
                    var activity = all_user_activities[i];
                    if (activity.userId) {
                        if ((activity.userId) == (user_id)) {

                            all_activitiesByUserID.push(activity);
                        }
                    }
                }
                return all_activitiesByUserID;
            } else {
                return getAllActivitiesLocal();

            }
        }

        /**
         * update activity only local or local and in firebase
         * @param activity
         */
        function updateActivity(activity) {
            var activities = getAllActivitiesLocal();
            for (var i = 0; i < activities.length; i++) {
                var _activity = activities[i];
                if ((_activity.id == activity.id)) {
                    activities.splice(i, 1);
                    activities.push(activity);
                    localStorage.setItem('activities', JSON.stringify(activities));
                    break;
                }
            }
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            if (firebaseConnected) {

                getAllActivities_firebase().$save(activity);
                //update local List of activties saved on firebase (activities_firebase)
                var activities_firebase = localStorage.getItem('activities_firebase'); // Activities saved on firebase.
                if (activities_firebase) {
                    activities_firebase = JSON.parse(activities_firebase);
                    for (var i = 0; i < activities_firebase.length; i++) {
                        var _activity = activities[i];
                        if ((_activity.id == activity.id)) {
                            activities_firebase.splice(i, 1);
                            activities_firebase.push(activity);
                            localStorage.setItem('activities_firebase', JSON.stringify(activities_firebase));
                            break;
                        }
                    }
                }

            }
        }

        /**
         * get activity by id
         * @param id: id of activity local. If firebase connected, it will be converted to activtysid in firebase
         * @return {activty by id|null if the key is not found*}
         */
        function getActivityByID(id) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            var cur_userId = getCurrentUserId();
            if (firebaseConnected && cur_userId) {
                id =getFirebaseId(cur_userId, id);  //converted to activtysid in firebase
                return getAllActivities_firebase().$getRecord(id);
            } else {
                var activities = getAllActivitiesLocal();
                for (var i = 0; i < activities.length; i++) {
                    var activity = activities[i];
                    if (activity.id == id) {
                        return activity;
                    }
                }
                return null;
            }
        }

        /**
         * remove a activty by id only local or local and from firebase.
         * @param id
         */
        function removeActivity(id) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            var activities = getAllActivitiesLocal();
            for (var i = 0; i <activities.length; i++) {
                var activity = activities[i];
                if (activity.id == id) {
                    activities.splice(i,1);
                    localStorage.setItem('activities', JSON.stringify(activities));
                    break;
                }
            }
            if (firebaseConnected) {
                var userId = localStorage.getItem('userId');

                getAllActivities_firebase().$remove(getActivityByID(getFirebaseId(userId, id)));
                var activities_firebase = localStorage.getItem('activities_firebase'); // Activities saved on firebase.
                if (activities_firebase) {
                    activities_firebase = JSON.parse(activities_firebase);
                    for (var i = 0; i < activities_firebase.length; i++) {
                        var activity_f = activities_firebase[i];
                        if ((activity_f.id == id)) {
                            activities_firebase.splice(i, 1);
                            localStorage.setItem('activities_firebase', JSON.stringify(activities_firebase));
                            break;
                        }
                    }
                }
            }

        }

        /**
         * remove all activties by usersid
         * @param user_Id: usersid
         */
        function removeAllActivities(user_Id) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            localStorage.removeItem('activities');
            if (firebaseConnected) {
                getAllActivities_firebase(user_Id).$remove();
            }
        }

        /*******************************competition********************************************/
        /**
         * Add a competition
         * @param competition
         * @throws exception if user is not registered
         */
        function addCompetition(competition) {
            var firebaseConnected = localStorage.getItem('firebaseConection') == 'true';
            var userId =getCurrentUserId();
             if(firebaseConnected&userId){
                 getAllCompetitions_firebase().$add(competition);
             }else {
                 throw 'Um eine Competition anzulegen müssen Sie :<br>'+'<li>in Settings Die Firebase Verbindung akzeptieren falls noch nicht </li>'+'<li>sich registrieren oder anmelden</li>';
             }
        }

        /**
         * remove competition by id
         * @param id: competitions id
         */
        function removeCompetition(id) {
            getAllCompetitions_firebase().$remove(getCompetitionByID(id));
        }

        /**
         * get competition by id
         * @param id competitions id
         * @return {Object|null if the key is not found*}
         */
        function getCompetitionByID(id) {
            return getAllCompetitions_firebase().$getRecord(id);
        }

        /**
         * get all competions of user by user_id
         * @param user_id. usersid
         * @return {Object|null if the key is not found*}
         */
        function getAllCompetitions(user_id) {
            return getAllCompetitions_firebase().$getRecord(user_id);
        }

        var service = {
            //User
            getAllUsers: getAllUsers,
            addUser: addUser,
            updateUser: updateUser,
            getUserByID: getUserByID,
            removeUser: removeUser,
            getCurrentUserId: getCurrentUserId,
            //Activities
            getAllActivities: getAllActivities,
            getActivityByID: getActivityByID,
            addActivity: addActivity,
            updateActivity: updateActivity,
            removeActivity: removeActivity,
            //competition
            getAllCompetitions: getAllCompetitions,
            getCompetitionByID: getCompetitionByID,
            addCompetition: addCompetition,
            removeCompetition: removeCompetition

        };
        return service;

    }
)
;
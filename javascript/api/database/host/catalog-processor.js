const mysql = require('mysql');
const utils = require('./utils.js');

const dbName = 'monstercatDB';

const mysqlConnection = mysql.createConnection({
    host: 'mariadb',
    user: 'root',
    password: 'JacPV7QZ',
    database: dbName
});

function processCatalogSearch(searchString, terms, trackArray, skip, limit, gold, callback, errorCallback) {
    mysqlConnection.connect(err => {
        if (err) {
            console.log(err);
            errorCallback(err);
        } else {
            for (var k = 1; k < terms.length; k++) {
                trackArray = trackArray.filter(track => new RegExp(terms[k], 'i').test(track.search));
            }
        
            for (var i = 0; i < trackArray.length; i++) {
                trackArray[i].similarity = utils.similarity(trackArray[i].search.replace(trackArray[i].id, ''), searchString);
            }
        
            trackArray.sort(function (a, b) {
                if (a.similarity < b.similarity) return 1;
                if (a.similarity > b.similarity) return -1;
                return 0;
            });
        
            trackArray = trackArray.slice(skip, skip + limit);
        
            var i = 0;
        
            var releasesQueryFinished = function () {
                if (i < trackArray.length) {
                    const releaseQuery = 'SELECT artistsTitle, catalogId, id, releaseDate, title, type FROM `' + dbName + '`.`releases` WHERE id="' + trackArray[i].releaseId + '";';
        
                    mysqlConnection.query(releaseQuery, (err, releaseResult) => {
                        if (err) {
                            errorCallback(err);
                        } else {
                            utils.addMissingTrackKeys(trackArray[i], gold, releaseResult[0], mysqlConnection, function (track) {
                                trackArray[i] = track;
                                i++;
                                releasesQueryFinished();
                            }, function (err) {
                                errorCallback(err);
                            });
                        }
                    });
                } else {
                    callback(trackArray);
                }
            };
        
            releasesQueryFinished();
        }
    });
}

process.on('message', async (data) => {
    processCatalogSearch(data.searchString, data.terms, data.trackArray, data.skip, data.limit, data.gold, function (result) {
        process.send({ results: result });
    }, function (err) { process.send({ err: err }) });
});
# catplayer-helper-api
A helper api for the catplayer app

This api is hosted at https://api.lucaspape.de/monstercat/v1/

Deploy using
```
docker build -t lucaspape/catplayer-helper-api .
```
and
```
docker-compose up -d
```

# Available methods:

POST /playlist/addtrack

Request field | Description
-------------|------------
playlistId | id of playlist the track will be added to
newSong | jsonObject with releaseId and trackId
sid | monstercat connect sid (for authentication)

POST /playlist/deletetrack

Request field | Description
-------------|------------
playlistId | id of playlist the track will be added to
songDelete | jsonObject with releaseId, trackId and songDeleteIndex
sid | monstercat connect sid (for authentication)

GET /liveinfo

Get livestream info of the [twitch](https://www.twitch.tv/monstercat) livestream

Sample response:

```
{
  title	"Borneo"
  version	""
  artist	"Wolfgang Gartner & Aero Chord"
  releaseId	"d946c222-5bc3-499b-993a-75930a802705"
  artistId	"fd1cc546-0f93-49be-a9b8-f1a3d4e1dbe7"
  titleConfidence	75
  artistConfidence	87.5
  versionConfidence	100
  totalConfidence	81.25
 }
```

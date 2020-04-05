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

## GET [/catalog](https://api.lucaspape.de/monstercat/v1/catalog)

Returns 50 latest catalog songs

Arguments: skip,limit

## GET [/catalog/search](https://api.lucaspape.de/monstercat/v1/catalog/search)

Search for catalog songs

Arguments: term,skip,limit

## GET [/releases](https://api.lucaspape.de/monstercat/v1/releases)

Returns 50 lates releases (albums)

Arguments: skip,limit

## GET [/releases/search](https://api.lucaspape.de/monstercat/v1/releases/search)

Search for releases

Arguments: term,skip,limit

## GET [/artists](https://api.lucaspape.de/monstercat/v1/artists)

Returns 50 artists

Arguments: skip,limit

## GET [/artists/search](https://api.lucaspape.de/monstercat/v1/artists/search)

Search for artists

Arguments: term,skip,limit

## GET [/liveinfo](https://api.lucaspape.de/monstercat/v1/liveinfo)

Get livestream info of the [twitch](https://www.twitch.tv/monstercat) livestream

Warning: the track can be missing in the response if the track could not be found or a livestream event is currenly ongoing!

Sample response:

```
{
  "title": "Boom Bap",
  "version": "",
  "artist": "Matroda",
  "track": {
    "artists": [
      {
        "id": "a20733d2-bc82-4a18-9642-4e7f00ff63db",
        "name": "Matroda",
        "public": true,
        "role": "Primary",
        "uri": "matroda"
      }
    ],
    "artistsTitle": "Matroda",
    "bpm": 125,
    "creatorFriendly": true,
    "debutDate": "2018-03-05T03:00:51-05:00",
    "downloadable": false,
    "duration": 264,
    "explicit": false,
    "genrePrimary": "Dance",
    "genreSecondary": "House",
    "id": "999a17f4-bcd6-4d5c-9eba-8632a2fe487f",
    "inEarlyAccess": false,
    "isrc": "CA6D21800039",
    "playlistSort": 0,
    "release": {
      "artistsTitle": "Monstercat",
      "catalogId": "MCUV5",
      "id": "aebba702-628c-4f55-8ffb-02e31f11bd39",
      "releaseDate": "2018-08-16T03:00:00-04:00",
      "tags": null,
      "title": "Monstercat Uncaged Vol. 5",
      "type": "Album",
      "upc": "703980542613"
    },
    "streamable": true,
    "tags": [
      "Upbeat",
      "Bass",
      "Dancey",
      "EDM",
      "House",
      "electro",
      "Energetic",
      "Dirty",
      "Anthemic",
      "vocal chop",
      "groovy",
      "explosive"
    ],
    "title": "Boom Bap",
    "trackNumber": 30,
    "version": ""
  },
  "titleConfidence": 6.666666666666667,
  "artistConfidence": 77.77777777777779,
  "versionConfidence": 100,
  "totalConfidence": 42.22222222222223
}
```

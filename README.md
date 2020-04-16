# catplayer-helper-api
A helper api for the catplayer app

This api is hosted at https://api.lucaspape.de/monstercat/v1/

Deploy using
```
git clone https://github.com/lucaspape/catplayer-helper-api.git
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

## GET [/catalog/release/$mcID](https://api.lucaspape.de/monstercat/v1/catalog/release)

Returns album with tracks

Arguments: mcID

Example: [https://api.lucaspape.de/monstercat/v1/catalog/release/MCIV5](https://api.lucaspape.de/monstercat/v1/catalog/release/MCIV5)

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

## GET [/release/$releaseId/cover](https://api.lucaspape.de/monstercat/v1/release/)

Returns cover image of album (WEBP)

Arguments: image_width

Example: [https://api.lucaspape.de/monstercat/v1/release/28f65a57-a555-4c86-aa17-6f4c08e90f18/cover?image_width=512](https://api.lucaspape.de/monstercat/v1/release/28f65a57-a555-4c86-aa17-6f4c08e90f18/cover?image_width=512)

## POST [/related](https://api.lucaspape.de/monstercat/v1/related)

Returns trackIds that are related to several given trackIds

Arguments: skip,limit

Example:

POST:
```
{
  "tracks": [
    {
        "id":"f2105bab-0be5-473f-aa9d-db628855c5b1"
    },
    {
        "id":"4d268a5c-fedd-4b56-a8e4-72da4da4b017"
    }
  ]
}
```

Returns:
```
{
    "results": [
        {
            "id": "d0420179-2bba-48a7-af6f-f48f6dfec1ec",
            "similarity": 65.66194482905527
        },
        {
            "id": "cc6533ea-5f20-480e-8324-345d84634725",
            "similarity": 65.45731889693127
        },
        {
            "id": "8eb23916-c0c3-41d4-a81a-63436f6d6d09",
            "similarity": 65.43040019142191
        },
        ...
    ]
}
```

Warning: this request can take several seconds, please use the exclude array to exclude specific trackIds from the response to keep the track array as short as possible!
Example:

```
{
   "tracks":[
      {
         "id":"f819d830-21ba-4279-9fb1-ba41279b2d8e"
      },
      {
         "id":"700e3e14-ebc8-4c29-b484-15c30d0c37be"
      }
   ],
   "exclude":[
      {
         "id":"97216932-b75c-4620-85e8-1e1a170edf3b"  
      },
      {
         "id":"c291d14a-2706-47c7-9b9b-c7fabd5f4524"
      }
   ]
}
```

Use [/catalog/search](https://api.lucaspape.de/monstercat/v1/catalog/search) to get more info about song (use id as term)

## GET [/stats](https://api.lucaspape.de/monstercat/v1/stats)

Returns logs

## GET [/liveinfo](https://api.lucaspape.de/monstercat/v1/liveinfo)

Get livestream info of the [twitch](https://www.twitch.tv/monstercat) livestream

Warning: the track can be missing in the response if the track could not be found or a livestream event is currenly ongoing!

Sample response:

```
{
  "title": "What Are You Waiting For",
  "version": "",
  "artist": "Stonebank",
  "track": {
    "artists": [{
      "id": "f69849e2-5e70-45ab-a7ba-d0acd7d75e8b",
      "name": "Stonebank",
      "public": true,
      "role": "Primary",
      "uri": "stonebank"
    }],
    "artistsTitle": "Stonebank",
    "bpm": 128,
    "creatorFriendly": true,
    "debutDate": "2018-03-22T03:00:00-04:00",
    "duration": 256,
    "explicit": false,
    "genrePrimary": "Dance",
    "genreSecondary": "Electro",
    "id": "3d9ad36e-603d-459d-825e-9746ea775029",
    "isrc": "CA6D21800056",
    "playlistSort": 0,
    "release": {
      "artistsTitle": "Monstercat",
      "catalogId": "MCBO2018",
      "id": "b142c486-c9fc-4aaf-b04c-49ac548e8c73",
      "releaseDate": "2018-12-14T03:00:00-05:00",
      "tags": null,
      "title": "Monstercat - Best of 2018",
      "type": "Album",
      "upc": "703980543979"
    },
    "tags": ["nocontentid", "rocketleagueprimary"],
    "title": "What Are You Waiting For",
    "trackNumber": 31,
    "version": ""
  },
  "titleConfidence": 92.3076923076923,
  "artistConfidence": 81.81818181818183,
  "versionConfidence": 100,
  "totalConfidence": 87.06293706293707
}
```

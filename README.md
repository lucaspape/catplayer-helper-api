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

Arguments: skip,limit,skipMC

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
            "id": "0af71497-70c1-4fa5-967f-809aa1db034f",
            "artists": [
                {
                    "id": "450e700a-a864-4eed-b8ae-090747349e20",
                    "name": "SLANDER"
                },
                {
                    "id": "e173ce85-77d8-4170-9c93-8a89e55eee67",
                    "name": "Said The Sky"
                },
                {
                    "id": "f3758481-e1e6-4c16-8235-55b6aa379859",
                    "name": "JT Roach"
                },
                {
                    "id": "f69849e2-5e70-45ab-a7ba-d0acd7d75e8b",
                    "name": "Stonebank"
                }
            ],
            "artistsTitle": "SLANDER & Said The Sky feat. JT Roach",
            "bpm": 150,
            "creatorFriendly": "false",
            "debutDate": "2020-04-08T00:00:00.000Z",
            "debutTime": "T00:00:00-07:00",
            "duration": 201,
            "explicit": "false",
            "genrePrimary": "Dance",
            "genreSecondary": "Dubstep",
            "isrc": "CA6D22000154",
            "playlistSort": 0,
            "releaseId": "c461bdc4-353f-4436-830f-6b988ac3899f",
            "tags": [
                "melodic",
                "heavy",
                "gaming",
                "bass"
            ],
            "title": "Potions",
            "trackNumber": 9,
            "version": "Stonebank Remix",
            "inEarlyAccess": "false",
            "search": "SLANDER & Said The Sky feat. JT RoachDanceDubstep0af71497-70c1-4fa5-967f-809aa1db034fSLANDER & Said The Sky feat. JT RoachMCEP184c461bdc4-353f-4436-830f-6b988ac3899fPotionsStonebank RemixmelodicheavygamingbassSLANDERSaid The SkyJT RoachStonebank",
            "streamable": true,
            "downloadable": false,
            "release": {
                "artistsTitle": "SLANDER & Said The Sky feat. JT Roach",
                "catalogId": "MCEP184",
                "id": "c461bdc4-353f-4436-830f-6b988ac3899f",
                "releaseDate": "2020-04-08T00:00:00.000Z",
                "title": "Potions (Remixes)",
                "type": "EP"
            }
        },
        {
            "id": "d11337d5-6bae-4b4f-a930-b053bca0ef50",
            "artists": [
                {
                    "id": "e173ce85-77d8-4170-9c93-8a89e55eee67",
                    "name": "Said The Sky"
                },
                {
                    "id": "450e700a-a864-4eed-b8ae-090747349e20",
                    "name": "SLANDER"
                },
                {
                    "id": "f3758481-e1e6-4c16-8235-55b6aa379859",
                    "name": "JT Roach"
                },
                {
                    "id": "e3737895-793a-4941-ba6e-ee6810441338",
                    "name": "Au5"
                }
            ],
            "artistsTitle": "SLANDER & Said The Sky feat. JT Roach",
            "bpm": 153,
            "creatorFriendly": "false",
            "debutDate": "2020-04-08T00:00:00.000Z",
            "debutTime": "T00:00:00-07:00",
            "duration": 289,
            "explicit": "false",
            "genrePrimary": "Dance",
            "genreSecondary": "Dubstep",
            "isrc": "CA6D22000148",
            "playlistSort": 0,
            "releaseId": "c461bdc4-353f-4436-830f-6b988ac3899f",
            "tags": [
                "melodic",
                "heavy",
                "gaming",
                "bass"
            ],
            "title": "Potions",
            "trackNumber": 1,
            "version": "Au5 Remix",
            "inEarlyAccess": "false",
            "search": "SLANDER & Said The Sky feat. JT RoachDanceDubstepd11337d5-6bae-4b4f-a930-b053bca0ef50SLANDER & Said The Sky feat. JT RoachMCEP184c461bdc4-353f-4436-830f-6b988ac3899fPotionsAu5 RemixmelodicheavygamingbassSaid The SkySLANDERJT RoachAu5",
            "streamable": true,
            "downloadable": false,
            "release": {
                "artistsTitle": "SLANDER & Said The Sky feat. JT Roach",
                "catalogId": "MCEP184",
                "id": "c461bdc4-353f-4436-830f-6b988ac3899f",
                "releaseDate": "2020-04-08T00:00:00.000Z",
                "title": "Potions (Remixes)",
                "type": "EP"
            }
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

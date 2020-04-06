docker-compose --compatibility down
docker-compose --compatibility down -v
git pull
docker-compose --compatibility up --force-recreate --build -d

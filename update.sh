docker-compose down
docker-compose down -v
git pull
docker-compose up --force-recreate --build -d --scale web=10 database-artists=2 database-catalog=4 database-releases=4

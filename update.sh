docker-compose down
docker-compose down -v
git pull
docker-compose up --force-recreate --build -d --scale web=10

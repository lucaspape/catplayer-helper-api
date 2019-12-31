while true
do
cd ..
git pull
cd scripts/

timeout 3600 bash startapi.sh &
timeout 3600 bash recognize.sh
done

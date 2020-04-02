rm -rf screenshots/
rm -rf extracted/
rm -rf javascript/screenshots/
rm -rf javascript/extracted/
sudo mkdir /media/ramdisk/lucas
sudo chown api /media/ramdisk/lucas
mkdir /media/ramdisk/lucas/screenshots/
mkdir /media/ramdisk/lucas/extracted/
ln -s /media/ramdisk/lucas/screenshots/ screenshots
ln -s /media/ramdisk/lucas/extracted/ extracted
ln -s /media/ramdisk/lucas/screenshots/ javascript/screenshots
ln -s /media/ramdisk/lucas/extracted/ javascript/extracted

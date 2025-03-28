#!/bin/bash
cd $HOME
# Make the app
mkdir Desktop/Mindustry.app
mkdir Desktop/Mindustry.app/Contents
mkdir Desktop/Mindustry.app/Contents/MacOS
mkdir Desktop/Mindustry.app/Contents/Resources
# Start script
printf "#!/bin/bash\ncd $HOME/Mindustry\n./gradlew desktop:run" > Desktop/Mindustry.app/Contents/MacOS/Mindustry
chmod +x Desktop/Mindustry.app/Contents/Macos/Mindustry
# info.plist for icon
printf "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n<plist version=\"1.0\">\n  <dict>\n    <key>CFBundleIconFile</key>\n    <string>minIcon</string>\n  </dict>\n</plist>" > Desktop/Mindustry.app/Contents/info.plist
# Download icon 
curl --output Desktop/Mindustry.app/Contents/Resources/minIcon.icns https://penrosian.github.io/imghost/minIcon.icns
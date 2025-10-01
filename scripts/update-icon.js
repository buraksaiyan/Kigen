const sharp = require('sharp');
const fs = require('fs');

async function createSquareIcon() {
  try {
    console.log('Creating square InZone app icon...');
    
    // Backup the original Kigen icon if not already backed up
    if (!fs.existsSync('./assets/icon-kigen-backup.png')) {
      fs.copyFileSync('./assets/icon.png', './assets/icon-kigen-backup.png');
      console.log('✓ Backed up original Kigen icon');
    }
    
    // Read the InZone logo
    const image = sharp('./assets/images/inzone-applogo-bigger.png');
    const metadata = await image.metadata();
    
    console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);
    
    // Crop to make it square (crop 2 pixels from width to make it 987x987)
    // Then resize to a standard icon size (1024x1024)
    await image
      .extract({ left: 1, top: 0, width: 987, height: 987 }) // Crop 1px from each side
      .resize(1024, 1024, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background
      })
      .png()
      .toFile('./assets/icon.png');
    
    console.log('✓ Created square icon: 1024x1024');
    console.log('✓ Icon replaced with InZone logo successfully!');
    console.log('\nYou can now rebuild your app with the new icon.');
    
  } catch (error) {
    console.error('Error creating icon:', error);
    process.exit(1);
  }
}

createSquareIcon();

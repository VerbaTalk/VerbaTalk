const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure icons directory exists in dist
const createIconsDir = () => {
  const distIconsDir = path.join(__dirname, 'dist', 'icons');
  if (!fs.existsSync(distIconsDir)) {
    fs.mkdirSync(distIconsDir, { recursive: true });
  }
};

// Copy icon files from public to dist
const copyIcons = () => {
  const sourceDir = path.join(__dirname, 'public', 'icons');
  const destDir = path.join(__dirname, 'dist', 'icons');
  
  if (fs.existsSync(sourceDir)) {
    const files = fs.readdirSync(sourceDir);
    
    files.forEach(file => {
      if (file.endsWith('.png')) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
        
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${file} to dist/icons/`);
      }
    });
  } else {
    console.warn('Warning: source icons directory not found');
    
    // Create placeholder icons
    createPlaceholderIcons(destDir);
  }
};

// Create placeholder icons if they don't exist
const createPlaceholderIcons = (destDir) => {
  console.log('Creating placeholder icons...');
  
  // Try to find an icon creation tool
  try {
    // Check if ImageMagick is installed
    execSync('convert -version', { stdio: 'ignore' });
    
    // Create placeholder icons using ImageMagick
    const sizes = [16, 48, 128];
    const color = '#4a8cff';
    
    sizes.forEach(size => {
      const iconPath = path.join(destDir, `icon${size}.png`);
      execSync(`convert -size ${size}x${size} xc:${color} -fill white -gravity center -font Arial -pointsize ${size/2} -annotate 0 "TTS" ${iconPath}`);
      console.log(`Created placeholder icon: icon${size}.png`);
    });
  } catch (error) {
    console.warn('ImageMagick not found. Creating empty placeholder files instead.');
    
    // Create empty files as placeholders
    const sizes = [16, 48, 128];
    sizes.forEach(size => {
      const iconPath = path.join(destDir, `icon${size}.png`);
      fs.writeFileSync(iconPath, Buffer.from(''));
      console.log(`Created empty placeholder: icon${size}.png`);
    });
  }
};

// Run build process
const build = async () => {
  try {
    console.log('Creating icons directory...');
    createIconsDir();
    
    console.log('Copying icons...');
    copyIcons();
    
    console.log('Build process completed successfully!');
  } catch (error) {
    console.error('Build error:', error);
    process.exit(1);
  }
};

// Execute build
build(); 
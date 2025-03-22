# Troubleshooting Guide for AI Text to Speech Extension

This guide addresses common issues that developers may encounter when working with the AI Text to Speech browser extension.

## Build Issues

### Issue: Extension doesn't show up in browser

**Symptoms:**
- Extension is installed but doesn't appear in the extensions list
- Icon doesn't show up in the toolbar

**Solutions:**
1. Verify that the build completed successfully without errors
2. Check that the manifest.json file was properly generated in the dist folder
3. Ensure the icons are correctly referenced in the manifest.json
4. Try reloading the extension in the browser
5. Restart the browser

### Issue: Missing icon files

**Symptoms:**
- Browser console shows errors about missing icon files
- Extension appears with a default placeholder icon

**Solutions:**
1. Ensure all icon files (icon16.png, icon48.png, icon128.png) exist in the public/icons directory
2. Verify that the icons are properly copied to the dist folder during build
3. Check manifest.json for correct icon path references

## Runtime Issues

### Issue: Content script not working

**Symptoms:**
- No floating button appears when selecting text
- Context menu options don't appear

**Solutions:**
1. Check console for errors related to content-script.js
2. Verify that content scripts are properly registered in manifest.json
3. Ensure the "matches" pattern in manifest.json includes the sites you're testing on
4. Try reloading the page after enabling the extension
5. Verify that the content script is being injected (check Network tab in DevTools)

### Issue: Audio doesn't play

**Symptoms:**
- Text is selected, UI shows processing, but no audio plays
- Error messages about audio playback in console

**Solutions:**
1. Check if the backend server is running
2. Verify the server URL in the extension settings
3. Check for CORS issues in the browser console
4. Ensure the audio format is supported by the browser
5. Check network requests to see if audio file is being returned
6. Test the TTS API endpoints directly using tools like Postman

### Issue: Extension popup not loading

**Symptoms:**
- Clicking extension icon shows blank popup
- Popup shows error or doesn't open at all

**Solutions:**
1. Check console errors in the popup's developer tools
2. Verify that popup.html and popup.js are correctly referenced in manifest.json
3. Ensure all Vue components are properly imported and registered
4. Check for runtime JavaScript errors in popup.js

## Backend Server Issues

### Issue: Server doesn't start

**Symptoms:**
- Error messages when trying to start the server
- Server starts but immediately crashes

**Solutions:**
1. Verify all dependencies are installed (`npm install` in server directory)
2. Check that the required .env variables are set correctly
3. Ensure the specified port is not already in use
4. Check server logs for specific error messages

### Issue: TTS API requests failing

**Symptoms:**
- Error messages about API calls in server logs
- 500 or 400 errors when calling TTS endpoints

**Solutions:**
1. Verify API keys are correctly set in the .env file
2. Check that API provider services are operational
3. Verify the request format matches the API documentation
4. Add more detailed error logging to diagnose the specific issue
5. Test API calls directly using curl or Postman

## Browser-Specific Issues

### Chrome Issues

**Symptoms:**
- Extension works in Firefox but not in Chrome
- Chrome-specific console errors

**Solutions:**
1. Check for Chrome-specific manifest.json requirements
2. Verify permissions required for Chrome
3. Check for Chrome extension policy violations
4. Test with Chrome in developer mode

### Firefox Issues

**Symptoms:**
- Extension works in Chrome but not in Firefox
- Firefox-specific console errors

**Solutions:**
1. Verify Firefox-compatible permissions in manifest.json
2. Check for Firefox-specific API compatibility issues
3. Ensure the extension is loaded as a temporary add-on during development
4. Test with Firefox's safe mode to rule out conflicts with other extensions

## Permission Issues

### Issue: Missing permissions

**Symptoms:**
- Features don't work on certain websites
- Console shows permission errors

**Solutions:**
1. Check manifest.json for the required permissions:
   - `activeTab` for accessing the current tab
   - `storage` for saving settings
   - Host permissions for making API requests
2. Request only the permissions that are actually needed
3. Consider using optional permissions that can be requested at runtime

## Development Workflow Issues

### Issue: Hot reloading not working

**Symptoms:**
- Changes to code don't appear in the extension without manual reload
- Development build doesn't update automatically

**Solutions:**
1. Check Vite configuration for proper extensions support
2. Verify that watch mode is enabled
3. Some extension parts may require manual reloading (background scripts)
4. Consider using tools like chokidar for better file watching

### Issue: Inconsistent build output

**Symptoms:**
- Builds are inconsistent between development and production
- Some files are missing in the production build

**Solutions:**
1. Check build scripts and configuration
2. Verify that all necessary files are included in the build process
3. Add clear clean steps before each build
4. Use more explicit file inclusion patterns in the build configuration

## Debugging Tips

1. **Enable Verbose Logging:**
   ```javascript
   // Add this to critical functions
   console.log('Function X called with:', arguments);
   ```

2. **Inspect Network Requests:**
   - Use the Network tab in DevTools to monitor API calls
   - Check request/response data for any issues

3. **Test Components in Isolation:**
   - If a specific feature isn't working, try to isolate and test it independently
   - Create simple test pages for content script functionality

4. **Check Browser Extension Compatibility:**
   - Review browser-specific documentation for any API differences
   - Test in multiple browsers to isolate browser-specific issues

## Getting Help

If you're still experiencing issues after trying these troubleshooting steps:

1. Check the project's GitHub Issues for similar problems and solutions
2. Search Stack Overflow for related browser extension development questions
3. Join browser extension development communities for advice
4. Report a clear, detailed issue on the project's GitHub repository with:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser version
   - Console logs
   - Screenshots if applicable 
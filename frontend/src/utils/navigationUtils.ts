/**
 * Navigate back to a specific page with scroll restoration to a section
 * @param navigate - React Router navigate function
 * @param path - Path to navigate to (e.g., '/' or '/solutions')
 * @param sectionId - ID of the section to scroll to (without #)
 */
export const navigateToPageSection = (
  navigate: (to: string, options?: { replace?: boolean }) => void,
  path: string,
  sectionId: string
) => {
  // Navigate to page with hash
  navigate(`${path}#${sectionId}`, { replace: false });
};

/**
 * Navigate back to the Our Core Services section
 * Automatically detects which page the user came from (homepage or solutions page)
 * @param navigate - React Router navigate function
 */
export const navigateBackToCoreServices = (navigate: (to: string, options?: { replace?: boolean }) => void) => {
  // Check sessionStorage for the referrer page
  const referrerPage = sessionStorage.getItem('coreServicesReferrer') || '/';

  // Navigate back to the appropriate page with the core-services hash
  navigate(`${referrerPage}#core-services`, { replace: false });

  // Clean up the referrer after navigation
  sessionStorage.removeItem('coreServicesReferrer');
};

/**
 * Store the current page as the referrer before navigating to a service
 * Call this when a user clicks on a service card
 * @param currentPath - Current page path (e.g., '/' or '/solutions')
 */
export const setServiceReferrer = (currentPath: string) => {
  sessionStorage.setItem('coreServicesReferrer', currentPath);
};

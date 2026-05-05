# TabiPass UI Test Plan

## 1. Application Overview
TabiPass (https://tabipass.jp/) is a private booking portal for corporate employees providing exclusive hotel discounts. It features a public-facing landing page, a hotel catalog (region-filtered), and a restricted member area accessible via login.

## 2. Route Inventory
- **Home**: `https://tabipass.jp/`
- **Hotel List**: `https://tabipass.jp/hotels` (Assumed path based on analysis)
- **Contact**: `https://tabipass.jp/contact`
- **Privacy Policy**: `https://tabipass.jp/privacy`
- **Terms of Use**: `https://tabipass.jp/terms`
- **Login**: `https://tabipass.jp/login` (or Modal trigger)

## 3. Interaction Inventory
- **Header**:
  - Logo (Link to Home)
  - Navigation: "Hotels", "About", "Contact"
  - Language Switcher: JP / EN
  - "Member Login" button
- **Hotel List**:
  - Region filters (Hokkaido, Tohoku, Kanto, Chubu, Kinki, Chugoku, Shikoku, Kyushu, Okinawa)
  - Hotel cards (Link to details)
- **Login Modal/Page**:
  - Account ID input
  - Password input
  - Login submit button
- **Contact Form**:
  - Name, Email, Company, Message fields
  - Submit button

## 4. Scenario Matrix
| ID | Scenario | Priority | Type |
|---|---|---|---|
| UI-Home-01 | Verify Homepage loads and displays key sections | P0 | smoke |
| UI-Login-01 | Failed login with invalid credentials | P0 | negative |
| UI-Hotel-01 | Filter hotels by region | P1 | regression |
| UI-Contact-01 | Submit contact form (HR inquiry) | P1 | smoke |
| UI-Local-01 | Toggle language between JP and EN | P1 | localization |

## 5. Detailed Scenarios

### UI-Home-01: Verify Homepage loads and displays key sections
- **ID**: `UI-Home-01`
- **Priority**: `P0`
- **Type**: `smoke`
- **Route**: `https://tabipass.jp/`
- **Preconditions**: None
- **Test Data**: None
- **Steps**:
  1. Navigate to `https://tabipass.jp/`
  2. Verify the page title is correct
  3. Verify the "Member Login" button is visible
  4. Scroll down to verify mission statement and process overview are present
- **Assertions**:
  1. Page title contains "TabiPass"
  2. Header navigation is visible
  3. "Member Login" button is present and clickable
- **Failure Signals**: Page doesn't load, 404/500 errors, key CTA missing.

### UI-Login-01: Failed login with invalid credentials
- **ID**: `UI-Login-01`
- **Priority**: `P0`
- **Type**: `negative`
- **Route**: `https://tabipass.jp/`
- **Preconditions**: None
- **Test Data**:
  - Account ID: `invalid-user`
  - Password: `wrong-password`
- **Steps**:
  1. Navigate to `https://tabipass.jp/`
  2. Click "Member Login"
  3. Enter `invalid-user` into Account ID field
  4. Enter `wrong-password` into Password field
  5. Click "Login" button
- **Assertions**:
  1. Error message "Invalid ID or password" (or equivalent in JP) is displayed
  2. User remains on the login page/modal
- **Failure Signals**: Successful login with invalid data, no error message, app crash.

### UI-Hotel-01: Filter hotels by region
- **ID**: `UI-Hotel-01`
- **Priority**: `P1`
- **Type**: `regression`
- **Route**: `https://tabipass.jp/hotels`
- **Preconditions**: None
- **Test Data**: Region: `Okinawa`
- **Steps**:
  1. Navigate to Hotel List page
  2. Click on "Okinawa" in the region filter
  3. Verify the displayed hotels are in Okinawa
- **Assertions**:
  1. The list updates to show only Okinawa hotels
  2. At least one hotel card is visible (if data exists)
- **Failure Signals**: List doesn't update, all hotels shown, empty list when hotels expected.

### UI-Contact-01: Submit contact form (HR inquiry)
- **ID**: `UI-Contact-01`
- **Priority**: `P1`
- **Type**: `smoke`
- **Route**: `https://tabipass.jp/contact`
- **Preconditions**: None
- **Test Data**:
  - Name: `Test User`
  - Email: `test@example.com`
  - Message: `This is a test inquiry.`
- **Steps**:
  1. Navigate to Contact page
  2. Fill in Name, Email, and Message
  3. Click "Submit"
- **Assertions**:
  1. Success message is displayed
- **Failure Signals**: Form validation errors on valid data, no confirmation.

### UI-Local-01: Toggle language between JP and EN
- **ID**: `UI-Local-01`
- **Priority**: `P1`
- **Type**: `localization`
- **Route**: `https://tabipass.jp/`
- **Preconditions**: None
- **Test Data**: None
- **Steps**:
  1. Navigate to `https://tabipass.jp/`
  2. Identify "Member Login" button text (JP: 会員ログイン)
  3. Click "EN" in language switcher
  4. Verify button text changes to "Member Login"
  5. Click "JP" in language switcher
  6. Verify button text changes back
- **Assertions**:
  1. Language switcher works correctly
  2. Text content updates according to selected language
- **Failure Signals**: Language doesn't change, text remains in JP, broken links after switch.

## 6. Risks and Known Unknowns
- Exact selectors for login modal and form fields are not confirmed yet.
- Some routes (like `/hotels`) might require authentication to view fully.
- Contact form submission might be disabled in test environments or require a captcha.

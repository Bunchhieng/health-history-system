# HealthTrack Application

This application consists of a Next.js frontend and an Express.js backend for managing patient health histories.

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- MongoDB (Make sure it's installed and running)
- Docker

## Setup

1. Clone the repository:
   ```
   git clone https://github.com/Bunchhieng/health-history-system
   cd health-history-system
   ```

2. Install dependencies for both backend and frontend:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   MONGODB_URI=mongodb://localhost:27017/healthhistory
   PORT=3001
   ```
   Adjust the MONGODB_URI if your MongoDB setup is different.

## Running the Application

To start both the frontend and backend servers: `npm run start` on the root directory

## Deep Dive: Health History Parser

Our health history parser is designed to handle and normalize data from various third-party sources. Here's an overview of its current capabilities and potential future enhancements:

### Current Capabilities

1. Field Mapping: The parser can handle different field names for the same data point using a flexible mapping system.

2. Data Normalization:
   - Dates are converted to a consistent ISO format.
   - Strings are trimmed and converted to lowercase.
   - Medication dosages are normalized to a common unit (mg).

3. Data Validation: The parser uses Zod for schema validation, ensuring the incoming data structure meets our expectations.

4. Handling New Fields: Any fields not explicitly mapped are still included in the parsed data, allowing for extensibility.

5. Duplicate Removal: The parser removes duplicate entries based on the 'name' field.

6. Basic Data Quality Checks: It filters out entries with specific "junk" values and performs some basic quality checks.

7. Versioning: The parser has a basic versioning system to handle potential major changes in data structure.

### Future Enhancements

1. Improve data validation with more health-specific checks.

2. Refine parsing algorithms to handle more edge cases.

3. Develop a system to resolve conflicting health data.

4. Enhance field mapping for complex health record structures.

5. Improve normalization of medical terms and diagnoses.

6. Add support for parsing lab results and vital signs.

7. Create a plugin system for different health data formats.

8. Optimize performance for large health datasets.

9. Improve error handling for parsing failures.

10. Extract and standardize metadata from health records.

11. Add tests :)

Implement auto-applying on job submission, default profile assignment per device (Marshal for the first device to open the site, Vaishnavi for any other device, with manual switching retained), and a native background web notification system without third-party services for PeerApply Nexus. Focus strictly on coding the tasks and skip all test suites and test documentation.

Working directory: c:\Users\marsh\Downloads\Job-Apply
Integrity mode: development

## Requirements

### R1. Automatic Application on Job Submission
When a student submits a new job, the system must automatically mark that job as applied for the submitting student immediately upon creation.

### R2. First-Device / Subsequent-Device Default Profile
The first device that opens the deployed website must default to Marshal's profile, and any other device must default to Vaishnavi's profile. Users must retain the ability to manually switch profiles.

### R3. In-House Background Web Notifications
When one student posts a job, the other student must be notified with the job title and company name via native browser desktop notifications (Web Notification API), including when the tab is backgrounded or when the user is in another application, without using third-party services.

### R4. Constraints
Focus strictly on coding and delivering the tasks directly in the application. Do not create test suites, test files, or test documentation. Never run git commit or git push.

## Acceptance Criteria

### Auto-Apply on Submission
- [ ] Creating a new job automatically records an application with status "Applied" for the submitting student.
- [ ] The submitted job immediately reflects the submitting student's "Applied" status in the UI.

### Device Profile Assignment
- [ ] The first device to connect to the deployed site is assigned Marshal (`marshal`) as its default active profile.
- [ ] Any other / subsequent device connecting to the site is assigned Vaishnavi (`vaishnavi`) as its default active profile.
- [ ] Users can manually switch their active profile at any time.

### Background Notifications
- [ ] When a job is posted by one user, a native browser notification showing the job title and company name is triggered for the other user.
- [ ] Notifications trigger successfully when the application tab is not actively focused or the user is in another application.
- [ ] The notification system uses native browser / in-house APIs without third-party push or messaging services.

### Constraints
- [ ] No git commit or git push commands are executed.
- [ ] No test suite files or test documentation files are created.

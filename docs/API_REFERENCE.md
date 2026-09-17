# NIRA API Reference & Data Services

Documentation for client-side and backend services powering NIRA.

## 📡 Supabase Services (`src/lib/niraService.ts`)

### `uploadDrainagePhoto(file: File): Promise<string>`
Uploads photographic evidence taken by the citizen to the Supabase Storage bucket named `storage` in folder `reports/`.
- **Bucket**: `storage`
- **Path**: `reports/{timestamp}_{sanitized_name}`
- **Fallback**: Local Object URL if offline or unauthenticated.

### `submitDrainageReport(input: CreateReportInput): Promise<DrainageReport>`
Creates a new civic incident record.
- **Priority Calculation**: Computed on-the-fly using severity score, road type weight, and repeat report density.
- **Ward Assignment**: Automatically matches GPS coordinate bounds to Kochi municipal wards (Ward 24 Ernakulam Central, Ward 35 Fort Kochi, Ward 12 Edappally, etc.).

### `getDrainageReports(filter?: ReportFilter): Promise<DrainageReport[]>`
Fetches incident records filtered by status (`active`, `resolved`, `escalated`) or ward.

### `updateReportStatus(id: string, status: ReportStatus, crewName?: string): Promise<void>`
Called by municipal officers in the Authority Command Center to assign rapid response crews, mark issues resolved, or escalate stalled tickets.

### `getHotspotClusters(): Promise<HotspotCluster[]>`
Retrieves geographic clusters where $\ge 3$ reports have occurred within 200m radius.

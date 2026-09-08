// T6.5: replaces the Branches tab -- GitHub's Insights, scoped to the two
// most useful sections for a local repo, one flat scrollable page.

import { ContributorsChart } from './ContributorsChart';
import { CodeFrequencyChart } from './CodeFrequencyChart';

export function Insights() {
  return (
    <div className="insights">
      <section className="insights-section">
        <h3>Contributors</h3>
        <ContributorsChart />
      </section>
      <section className="insights-section">
        <h3>Code frequency</h3>
        <CodeFrequencyChart />
      </section>
    </div>
  );
}

import React from 'react';

const AboutModal = ({ isOpen, onClose, summaryData }) => {
  if (!isOpen) return null;

  // Standard fallback data in case API fails
  const localSummary = summaryData || {
    portal: {
      name: "OneConnect Portal",
      url: "https://oneconnect.hcltech.com/",
      purpose: "Raising IT requests, software installs, reporting access issues, and incident tickets."
    },
    workflow: {
      standard_software: [
        "1. Search for 'Software request' on OneConnect.",
        "2. Raise a request for the desired software and note the RITM ticket number.",
        "3. Search for 'Software install request' on OneConnect.",
        "4. Raise the install request referencing the previous ticket number.",
        "5. Justification for all requests: 'Need for project'.",
        "6. IT support team will reach out and install the tool."
      ],
      ticket_prefixes: {
        "RITM": "Request, Install, and Access tickets (e.g. software setups)",
        "INC": "Incident and issue resolution tickets (e.g. extension fixes)"
      }
    },
    contacts: {
      aws_github_access: "Project Reporting Manager / Ganesh",
      github_offering: {
        product_name: "Microsoft GitHub Copilot Pay Per User Without GitHub Enterprise or MSDN Enterprise",
        org_name: "E250086-ProjectPulse-1008912AB0"
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>About HCL Tech Onboarding Assistant</h2>
          <button onClick={onClose} className="modal-close-btn">&times;</button>
        </div>
        <div className="modal-body">
          <section className="modal-section">
            <h3>Portal & Tickets</h3>
            <p>
              All equipment requests, software approvals, website access, and support queries are managed through HCL's official 
              portal: <a href={localSummary.portal.url} target="_blank" rel="noopener noreferrer" className="link-text">{localSummary.portal.url}</a>
            </p>
            <div className="ticket-types-grid">
              <div className="ticket-card">
                <span className="ticket-badge ritm">RITM...</span>
                <p>{localSummary.workflow.ticket_prefixes.RITM}</p>
              </div>
              <div className="ticket-card">
                <span className="ticket-badge inc">INC...</span>
                <p>{localSummary.workflow.ticket_prefixes.INC}</p>
              </div>
            </div>
          </section>

          <section className="modal-section">
            <h3>Standard Software Request Workflow</h3>
            <ol className="modal-list">
              {localSummary.workflow.standard_software.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="modal-section">
            <h3>Account & Code Access</h3>
            <div className="contact-details">
              <p><strong>AWS & GitHub Repositories:</strong> Reach out directly to your <em>{localSummary.contacts.aws_github_access}</em>.</p>
              <div className="github-request-box">
                <p className="font-semibold text-brand-800">For GitHub access request in OneConnect:</p>
                <ul className="sub-list">
                  <li><strong>Catalog Item:</strong> GitHub Offering</li>
                  <li><strong>Product Name:</strong> <code className="code-style">{localSummary.contacts.github_offering.product_name}</code></li>
                  <li><strong>Organization Name:</strong> <code className="code-style">{localSummary.contacts.github_offering.org_name}</code></li>
                </ul>
              </div>
            </div>
          </section>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">Close</button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;

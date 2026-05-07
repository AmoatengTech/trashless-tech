/* ─── TRASHLESS TECH - E-WASTE COLLECTION SCRIPT ─── */
document.addEventListener('DOMContentLoaded', function () {
    let currentStep = 1;
    const totalSteps = 5;

    // ⚠️ CONFIGURATION - UPDATE THESE VALUES
    const OPNFORM_TOKEN = "609|jBLh8VYjNNO84X8fQ8aPUVgvHX9lfbqiez9s2zm4031c6b0a"; // Your Bearer Token
    const OPNFORM_FORM_ID = "trashless-tech-hardware-donation-form-hfp1dg"; // Your Form ID from Dashboard
    const OPNFORM_ENDPOINT = `https://api.opnform.com/api/forms/${OPNFORM_FORM_ID}/submissions`;

    // ✅ EXPOSE FUNCTIONS GLOBALLY FOR INLINE ONCLICK HANDLERS
    window.goTo = function (step) {
        // Validate current step before moving forward (only when moving next)
        if (step > currentStep) {
            if (!validateStep(currentStep)) {
                alert("Please fill in all required fields marked with *");
                return;
            }
        }

        // Hide all steps
        document.querySelectorAll('.form-step').forEach(el => {
            el.classList.remove('active');
        });

        // Show target step
        const targetStep = document.getElementById('step' + step);
        if (targetStep) {
            targetStep.classList.add('active');
        }

        // Update Progress Bar
        updateProgressBar(step);
        currentStep = step;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.updateProgressBar = function (step) {
        const dots = document.querySelectorAll('.step-dot');
        dots.forEach((dot, index) => {
            if (index + 1 <= step) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    };

    /* ─── VALIDATION ─── */
    function validateStep(step) {
        const currentStepEl = document.getElementById('step' + step);
        if (!currentStepEl) return true;

        const inputs = currentStepEl.querySelectorAll('input[required], textarea[required], select[required]');
        let valid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#d32f2f';
                valid = false;
            } else {
                input.style.borderColor = '';
            }
        });

        // Special validation for inventory quantities (Step 2)
        if (step === 2) {
            const checkboxes = currentStepEl.querySelectorAll('.hardware-checkbox');
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    const inputId = cb.id + '-input';
                    const qtyInput = document.getElementById(inputId);
                    if (!qtyInput || qtyInput.value <= 0) {
                        if (qtyInput) qtyInput.style.borderColor = '#d32f2f';
                        valid = false;
                    } else {
                        if (qtyInput) qtyInput.style.borderColor = '';
                    }
                }
            });
        }

        return valid;
    }

    /* ─── INVENTORY CHECKBOX LOGIC ─── */
    document.querySelectorAll('.hardware-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const inputId = this.id + '-input';
            const inputEl = document.getElementById(inputId);
            if (inputEl) {
                inputEl.disabled = !this.checked;
                inputEl.required = this.checked;
                if (!this.checked) {
                    inputEl.value = '';
                    inputEl.style.borderColor = '';
                }
            }
        });
    });

    /* ─── OPNFORM SUBMISSION ─── */
    const form = document.getElementById('collectionForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            // Final validation
            if (!validateStep(5)) return;

            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.textContent;

            // UI Loading State
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";
            submitBtn.style.opacity = '0.7';

            const formData = new FormData(this);
            const data = Object.fromEntries(formData.entries());

            // Add metadata
            data.submittedAt = new Date().toISOString();
            data.formType = 'e-waste-collection';

            try {
                const response = await fetch(OPNFORM_ENDPOINT, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${OPNFORM_TOKEN}`
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // Success
                    document.getElementById('collectionForm').style.display = 'none';
                    const successScreen = document.getElementById('successScreen');
                    successScreen.classList.remove('hidden');
                    successScreen.style.display = 'block';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    // Handle API Errors
                    const errorData = await response.json().catch(() => ({}));
                    console.error('API Error:', errorData);
                    throw new Error(errorData.message || 'Submission failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert("An error occurred. Please try again or contact support.");
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.style.opacity = '1';
            }
        });
    }

    /* ─── INITIALIZATION ─── */
    // Set minimum date for pickup to today
    const dateInput = document.getElementById('preferredDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
    }

    // Initialize Progress Bar
    updateProgressBar(1);
});

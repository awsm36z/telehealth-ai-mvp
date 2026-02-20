import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

type Status = 'pass' | 'fail';

interface SystemEvalResult {
  id: string;
  name: string;
  status: Status;
  details: string;
}

async function runEval(
  id: string,
  name: string,
  fn: () => Promise<void>
): Promise<SystemEvalResult> {
  try {
    await fn();
    return { id, name, status: 'pass', details: 'OK' };
  } catch (error: any) {
    return {
      id,
      name,
      status: 'fail',
      details: error?.response?.data?.message || error?.message || 'Unknown error',
    };
  }
}

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const unique = Date.now();
  const patientEmail = `eval_patient_${unique}@example.com`;

  const results: SystemEvalResult[] = [];

  results.push(
    await runEval(
      'SYS-001',
      'Login language persists to profile (fr)',
      async () => {
        await axios.post(`${API_URL}/auth/register`, {
          fullName: 'Eval Patient',
          email: patientEmail,
          password: 'password123',
          userType: 'patient',
          language: 'en',
        });

        const login = await axios.post(`${API_URL}/auth/login`, {
          email: patientEmail,
          password: 'password123',
          userType: 'patient',
          language: 'fr',
        });

        assert(login.data?.user?.id, 'Missing user id from login response');
        assert(login.data?.user?.language === 'fr', 'Login response language should be fr');

        const profile = await axios.get(
          `${API_URL}/auth/profile/${login.data.user.id}?userType=patient`
        );
        assert(profile.data?.language === 'fr', 'Profile language should persist as fr');
      }
    )
  );

  results.push(
    await runEval(
      'SYS-002',
      'Profile language update endpoint stores selected language (ar)',
      async () => {
        const register = await axios.post(`${API_URL}/auth/register`, {
          fullName: 'Eval Doctor',
          email: `eval_doctor_${unique}@example.com`,
          password: 'password123',
          userType: 'doctor',
          language: 'en',
        });

        const userId = register.data?.user?.id;
        assert(userId, 'Missing user id from register response');

        await axios.put(`${API_URL}/auth/profile/${userId}/language`, {
          language: 'ar',
          userType: 'doctor',
        });

        const profile = await axios.get(`${API_URL}/auth/profile/${userId}?userType=doctor`);
        assert(profile.data?.language === 'ar', 'Profile language should be updated to ar');
      }
    )
  );

  results.push(
    await runEval(
      'SYS-003',
      'Messages thread stores senderLanguage metadata',
      async () => {
        const patientId = `eval-msg-${unique}`;
        const post = await axios.post(`${API_URL}/messages/${patientId}`, {
          senderType: 'doctor',
          senderName: 'Eval Doctor',
          senderLanguage: 'ar',
          message: 'Follow-up recommendations pending verification.',
        });

        assert(post.data?.data?.senderLanguage === 'ar', 'Posted message should keep senderLanguage');

        const list = await axios.get(`${API_URL}/messages/${patientId}`);
        assert(Array.isArray(list.data), 'Messages list should be an array');
        assert(list.data.length > 0, 'Messages list should include at least one message');
        assert(list.data[0]?.senderLanguage === 'ar', 'Stored message should include senderLanguage');
      }
    )
  );

  results.push(
    await runEval(
      'SYS-004',
      'Medication assist chat endpoint is available and returns disclaimer',
      async () => {
        const response = await axios.post(`${API_URL}/medication-assist/chat`, {
          patientId: `eval-med-${unique}`,
          locale: 'MA',
          question: 'What options should I review for influenza symptom relief?',
        });

        assert(typeof response.data?.answer === 'string', 'Medication chat should return an answer string');
        assert(
          String(response.data?.disclaimer || '').toLowerCase().includes('not a prescription'),
          'Medication chat should include non-prescription disclaimer'
        );
      }
    )
  );

  results.push(
    await runEval(
      'SYS-005',
      'Medication assist insights include possibleMedication entries',
      async () => {
        const response = await axios.post(`${API_URL}/medication-assist/insights`, {
          patientId: `eval-med-${unique}`,
          locale: 'MA',
        });

        assert(Array.isArray(response.data?.possibleMedication), 'possibleMedication should be an array');
        assert(response.data.possibleMedication.length > 0, 'possibleMedication should not be empty');
      }
    )
  );

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.length - passed;

  console.log('\nSystem Eval Results');
  console.log('===================');
  results.forEach((result) => {
    const badge = result.status === 'pass' ? 'PASS' : 'FAIL';
    console.log(`${badge} ${result.id} ${result.name}`);
    if (result.status === 'fail') {
      console.log(`  -> ${result.details}`);
    }
  });

  console.log(`\nSummary: ${passed}/${results.length} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('System eval runner failed:', error);
  process.exit(1);
});

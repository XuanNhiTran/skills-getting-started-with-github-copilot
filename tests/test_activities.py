from fastapi.testclient import TestClient
import pytest

from src.app import app, activities


@pytest.fixture(autouse=True)
def reset_activities():
    # Make a shallow copy of initial participants so tests can modify safely
    original = {k: v.copy() for k, v in activities.items()}
    yield
    # restore participants lists
    activities.clear()
    activities.update(original)


client = TestClient(app)


def test_get_activities_returns_expected_structure():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]


def test_signup_adds_participant():
    activity = "Chess Club"
    email = "alice@example.com"

    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"

    # verify participant appears
    data = client.get("/activities").json()
    assert email in data[activity]["participants"]


def test_signup_allows_duplicate_entries_current_behavior():
    activity = "Chess Club"
    email = "bob@example.com"

    # sign up twice
    r1 = client.post(f"/activities/{activity}/signup?email={email}")
    r2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert r1.status_code == 200 and r2.status_code == 200

    data = client.get("/activities").json()
    # duplicate allowed in current implementation -> count should be >=2
    occurrences = [p for p in data[activity]["participants"] if p == email]
    assert len(occurrences) >= 2


def test_remove_participant_and_errors():
    activity = "Programming Class"
    email = "emma@mergington.edu"

    # ensure participant exists initially
    data_before = client.get("/activities").json()
    assert email in data_before[activity]["participants"]

    # remove participant
    r = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r.status_code == 200
    assert f"Removed {email}" in r.json()["message"]

    data_after = client.get("/activities").json()
    assert email not in data_after[activity]["participants"]

    # removing again should return 404
    r2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert r2.status_code == 404

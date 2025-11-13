#!/usr/bin/env python3
# Vide coded change log updater/
import os
import re
import subprocess
from collections import defaultdict
from typing import Dict, List, Optional, Set, Tuple

CHANGELOG_PATH = 'CHANGELOG.md'

# Kinds we treat specially when they appear as the PR's 'most significant' type.
NON_USER_KINDS = {'build', 'doc', 'docs', 'chore', 'ci', 'style', 'refactor', 'test'}

# Priority of commit kinds when deciding a PR's 'most significant' component.
# Higher number means more significant.
KIND_PRIORITY = {
    'feat': 50,
    'fix': 40,
    'bug': 40,
    'perf': 30,
    'other': 20,
    # non-user kinds get low priority
    'build': 10,
    'doc': 10,
    'docs': 10,
    'chore': 10,
    'ci': 10,
    'style': 10,
    'refactor': 10,
    'test': 10,
}

CATEGORY_HEADINGS = {
    'feat': 'Features',
    'bug': 'Bug Fixes',
    'perf': 'Performance Improvements',
    'other': 'Other Changes',
}


def run_git(*args: str) -> str:
    """Run a git command and return stdout as text."""
    return subprocess.check_output(['git', *args], encoding='utf-8')


def parse_semver(v: str) -> Optional[Tuple[int, int, int]]:
    """Parse semantic version (X.Y.Z) into a tuple."""
    m = re.match(r'^(\d+)\.(\d+)\.(\d+)$', v.strip())
    if not m:
        return None
    return tuple(map(int, m.groups()))


def find_latest_version_in_changelog(path: str) -> Optional[str]:
    """Return the first (most recent) '## Version X.Y.Z' in CHANGELOG.md."""
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    matches = re.findall(r'^##\s+Version\s+(\d+\.\d+\.\d+)', content, re.MULTILINE)
    return matches[0] if matches else None


def get_semver_tags() -> List[Tuple[str, str]]:
    """Return list of (version, tag_name) sorted ascending by version."""
    tags_out = run_git('tag')
    tags: List[Tuple[str, str]] = []
    for line in tags_out.splitlines():
        raw = line.strip()
        if not raw:
            continue
        if raw.startswith('v'):
            version = raw[1:]
        else:
            version = raw
        if parse_semver(version):
            tags.append((version, raw))
    tags.sort(key=lambda vr: parse_semver(vr[0]))
    return tags


def classify_prefix(subject: str) -> Optional[str]:
    """
    Extract a conventional-commit style type prefix.

    Handles:
      - 'feat: summary'
      - 'feat(scope): summary'
      - 'docs(api): update docs'
    Returns the type (e.g. 'feat', 'docs') or None if not found.
    """
    s = subject.strip().lower()

    # type(scope): summary  OR  type: summary
    m = re.match(r'^([a-z]+)(\([^)]*\))?:', s)
    if m:
        return m.group(1)

    # Less common: 'feat(scope) summary' (no colon)
    m = re.match(r'^([a-z]+)\([^)]*\)\s', s)
    if m:
        return m.group(1)

    return None


def commit_kind(subject: str) -> str:
    """
    Classify a commit into a kind:
        feat, fix, bug, perf, build, doc, docs, chore, ci, style, refactor, test, or other
    """
    t = classify_prefix(subject)
    if t is None:
        return 'other'
    if t in ('feat', 'fix', 'bug', 'perf',
             'build', 'doc', 'docs', 'chore', 'ci', 'style', 'refactor', 'test'):
        return t
    # Any other typed prefix we treat as 'other' for purposes of significance.
    return 'other'


def strip_known_prefix(subject: str) -> str:
    """Strip a leading conventional-commit prefix from a title if present."""
    s = subject.strip()
    s_lower = s.lower()

    m = re.match(r'^([a-z]+)(\([^)]*\))?:\s*(.*)$', s_lower)
    if not m:
        return s
    # Use length of the matched prefix to strip from the original string.
    prefix_len = s_lower.find(m.group(3))
    if prefix_len <= 0:
        return s
    return s[prefix_len:].lstrip()


def extract_pr_from_merge(subject: str, body: str) -> Optional[Tuple[int, str]]:
    """
    For a merge commit, detect 'Merge pull request #N' and return (N, title).

    For GitHub-style merges, the body first non-empty line is the PR title.
    """
    m = re.search(r'Merge pull request #(\d+)', subject)
    if not m:
        m = re.search(r'Merge pull request #(\d+)', body)
        if not m:
            return None
    pr_num = int(m.group(1))

    title = ''
    for line in body.splitlines():
        line = line.strip()
        if line:
            title = line
            break
    if not title:
        title = subject
        title = re.sub(r'Merge pull request #\d+ from \S+', '', title).strip()
        if not title:
            title = subject.strip()

    return pr_num, title


def extract_pr_from_squash(subject: str) -> Optional[Tuple[int, str]]:
    """
    For squash/rebase merges, detect 'Some title (#123)' and return (123, title).
    """
    m = re.search(r'\(#(\d+)\)', subject)
    if not m:
        return None
    pr_num = int(m.group(1))
    title = re.sub(r'\s*\(#\d+\)\s*$', '', subject).strip()
    return pr_num, title or subject.strip()


def get_commits_for_merge(merge_sha: str) -> List[str]:
    """
    Return the list of non-merge commits included in a merge (parent1..merge).

    This excludes the merge commit itself and other merge commits in the range.
    """
    parents = run_git('show', '-s', '--format=%P', merge_sha).strip().split()
    if not parents:
        return [merge_sha]
    base = parents[0]
    revs = run_git('rev-list', '--no-merges', f'{base}..{merge_sha}')
    return [r.strip() for r in revs.splitlines() if r.strip()]


def categorize_pr(pr_num: int, commit_shas: Set[str],
                  subject_cache: Dict[str, str]) -> Optional[str]:
    """
    Categorize a PR based on its component commits.

    Returns:
        'feat', 'bug', 'perf', 'other', or None if the PR should be skipped.

    If the most significant kind is one of:
        build, doc, docs, chore, ci, style, refactor
    the PR is excluded.
    """
    best_kind: Optional[str] = None
    best_score = -1

    for sha in commit_shas:
        if sha not in subject_cache:
            subject_cache[sha] = run_git('show', '-s', '--format=%s', sha).strip()
        kind = commit_kind(subject_cache[sha])
        score = KIND_PRIORITY.get(kind, 0)
        if score > best_score:
            best_score = score
            best_kind = kind

    if best_kind is None:
        return None

    if best_kind in NON_USER_KINDS:
        return None

    if best_kind == 'feat':
        return 'feat'
    if best_kind in ('fix', 'bug'):
        return 'bug'
    if best_kind == 'perf':
        return 'perf'
    return 'other'


def build_section_for_range(version: str, tag: str, prev_tag: Optional[str]) -> Optional[str]:  # noqa
    """
    Build a changelog section for a version from git log between prev_tag..tag.

    Only PRs are included; each PR is categorized by the most significant
    component commit. PRs that are build/docs/chore/ci/style/refactor-only
    are skipped.
    """
    if prev_tag:
        range_expr = f'{prev_tag}..{tag}'
    else:
        range_expr = tag

    fmt = '%H%x01%s%x01%b%x00'
    out = run_git('log', f'--pretty=format:{fmt}', range_expr)
    entries = out.split('\x00')

    pr_titles: Dict[int, str] = {}
    pr_merge_shas: Dict[int, str] = {}
    pr_component_shas: Dict[int, Set[str]] = defaultdict(set)

    for entry in entries:
        entry = entry.strip()
        if not entry:
            continue
        parts = entry.split('\x01', 2)
        if len(parts) < 2:
            continue
        sha = parts[0]
        subject = parts[1].strip()
        body = parts[2] if len(parts) > 2 else ''

        merge_info = extract_pr_from_merge(subject, body)
        if merge_info:
            pr_num, title = merge_info
            pr_merge_shas[pr_num] = sha
            if pr_num not in pr_titles:
                pr_titles[pr_num] = title
            continue

        squash_info = extract_pr_from_squash(subject)
        if squash_info:
            pr_num, title = squash_info
            pr_component_shas[pr_num].add(sha)
            if pr_num not in pr_titles:
                pr_titles[pr_num] = title
            continue

    if not pr_titles and not pr_merge_shas and not pr_component_shas:
        return None

    subject_cache: Dict[str, str] = {}
    cat_to_lines: Dict[str, List[str]] = {k: [] for k in CATEGORY_HEADINGS}

    pr_nums: Set[int] = set(pr_titles.keys()) | set(pr_merge_shas.keys()) | set(
        pr_component_shas.keys())

    for pr_num in sorted(pr_nums):
        commit_shas: Set[str] = set()
        if pr_num in pr_merge_shas:
            commit_shas.update(get_commits_for_merge(pr_merge_shas[pr_num]))
        if pr_num in pr_component_shas:
            commit_shas.update(pr_component_shas[pr_num])
        if not commit_shas:
            continue

        category = categorize_pr(pr_num, commit_shas, subject_cache)
        if category is None:
            continue

        raw_title = pr_titles.get(pr_num, f'PR #{pr_num}')
        title = strip_known_prefix(raw_title)
        line = f'- {title} ([#{pr_num}](../../pull/{pr_num}))'
        cat_to_lines[category].append(line)

    if not any(cat_to_lines[k] for k in cat_to_lines):
        return None

    parts: List[str] = []
    parts.append(f'## Version {version}\n')

    for key in ['feat', 'bug', 'perf', 'other']:
        lines = cat_to_lines[key]
        if not lines:
            continue
        heading = CATEGORY_HEADINGS[key]
        parts.append(f'### {heading}\n')
        parts.extend(lines)
        parts.append('')

    parts.append('')
    return '\n'.join(parts)


def main() -> None:
    latest_in_file = find_latest_version_in_changelog(CHANGELOG_PATH)
    print(f'Latest version in changelog: {latest_in_file}')

    tags = get_semver_tags()
    if not tags:
        print('No semantic-version tags found.')
        return

    if latest_in_file:
        latest_tuple = parse_semver(latest_in_file)
        pending = [(v, t) for v, t in tags if parse_semver(v) > latest_tuple]
    else:
        pending = tags[:]

    if not pending:
        print('No newer tags than changelog.')
        return

    version_to_index = {v: i for i, (v, _) in enumerate(tags)}
    pending_sorted = sorted(pending, key=lambda vt: parse_semver(vt[0]), reverse=True)

    new_sections: List[str] = []

    for version, tag in pending_sorted:
        idx = version_to_index[version]
        prev_tag = tags[idx - 1][1] if idx > 0 else None
        print(f'Building section for {version} (tag {tag}, prev {prev_tag})')
        section = build_section_for_range(version, tag, prev_tag)
        if section:
            new_sections.append(section)
        else:
            print(f'  Skipped {version} (no user-visible PR changes)')

    if not new_sections:
        print('No sections to add.')
        return

    new_text = '\n'.join(new_sections)

    if os.path.exists(CHANGELOG_PATH):
        with open(CHANGELOG_PATH, 'r', encoding='utf-8') as f:
            old_content = f.read()
    else:
        old_content = ''

    if old_content.strip():
        m = re.match(r'^(# .*\n+)', old_content)
        if m:
            header = m.group(1)
            rest = old_content[len(header):]
            updated = header + '\n' + new_text + rest
        else:
            updated = new_text + old_content
    else:
        updated = '# GeoJS Change Log\n\n' + new_text

    with open(CHANGELOG_PATH, 'w', encoding='utf-8') as f:
        f.write(updated)

    print(f'Updated {CHANGELOG_PATH} with {len(new_sections)} new version(s).')


if __name__ == '__main__':
    main()

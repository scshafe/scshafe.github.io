#!/usr/bin/env python3
"""
Reset and Seed Script

Resets the content directory by removing all current content files
and copying over example data from the example_data folder.

Usage:
    python3 backend/reset_and_seed.py                    # Reset everything
    python3 backend/reset_and_seed.py --data-only        # Reset only views/posts/experiences
    python3 backend/reset_and_seed.py --settings-only    # Reset only settings.json
    python3 backend/reset_and_seed.py --interactive      # Interactive mode with step-by-step options
"""

import sys
import shutil
import json
import os
import tempfile
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum

# Get the root directory (parent of backend/)
ROOT_DIR = Path(__file__).parent.parent
CONTENT_DIR = ROOT_DIR / 'content'
EXAMPLE_DATA_DIR = ROOT_DIR / 'example_data'
CONFIGS_DIR = ROOT_DIR / 'backend' / 'reset_configs'

# Content subdirectories
VIEWS_DIR = CONTENT_DIR / 'views'
POSTS_DIR = CONTENT_DIR / 'posts'
EXPERIENCES_DIR = CONTENT_DIR / 'experiences'

# Example data subdirectories
EXAMPLE_VIEWS_DIR = EXAMPLE_DATA_DIR / 'views'
EXAMPLE_POSTS_DIR = EXAMPLE_DATA_DIR / 'posts'
EXAMPLE_EXPERIENCES_DIR = EXAMPLE_DATA_DIR / 'experiences'


class StepStatus(Enum):
    PENDING = "pending"
    INCLUDED = "included"
    OMITTED = "omitted"
    COMPLETED = "completed"


@dataclass
class ResetStep:
    """Represents a single reset step."""
    id: str
    name: str
    description: str
    action: Callable
    data: Optional[Dict[str, Any]] = None
    status: StepStatus = StepStatus.PENDING
    modified_data: Optional[Dict[str, Any]] = None


@dataclass
class InteractiveSession:
    """Tracks the state of an interactive reset session."""
    steps: List[ResetStep] = field(default_factory=list)
    permanent_changes: List[str] = field(default_factory=list)
    special_selections: Dict[str, Any] = field(default_factory=dict)


# Color codes for terminal output
class Colors:
    YELLOW = '\033[33m'
    GREEN = '\033[32m'
    RED = '\033[31m'
    BLUE = '\033[34m'
    CYAN = '\033[36m'
    MAGENTA = '\033[35m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


def print_step(msg: str):
    """Print a step message with formatting."""
    print(f"{Colors.YELLOW}[Reset]{Colors.RESET} {msg}")


def print_success(msg: str):
    """Print a success message with formatting."""
    print(f"{Colors.GREEN}[Reset]{Colors.RESET} {msg}")


def print_error(msg: str):
    """Print an error message with formatting."""
    print(f"{Colors.RED}[Reset]{Colors.RESET} {msg}")


def print_info(msg: str):
    """Print an info message with formatting."""
    print(f"{Colors.CYAN}[Info]{Colors.RESET} {msg}")


def print_header(msg: str):
    """Print a header message."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg.center(60)}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")


def remove_directory_contents(dir_path: Path):
    """Remove all contents of a directory but keep the directory itself."""
    if dir_path.exists():
        for item in dir_path.iterdir():
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
        print_step(f"Cleared {dir_path}")


def copy_directory_contents(src_dir: Path, dest_dir: Path):
    """Copy all contents from source directory to destination."""
    if not src_dir.exists():
        print_step(f"Source directory {src_dir} does not exist, skipping")
        return

    dest_dir.mkdir(parents=True, exist_ok=True)

    for item in src_dir.iterdir():
        dest_item = dest_dir / item.name
        if item.is_dir():
            shutil.copytree(item, dest_item)
        else:
            shutil.copy2(item, dest_item)

    file_count = len(list(src_dir.iterdir()))
    print_step(f"Copied {file_count} items from {src_dir.name}/ to {dest_dir}")


def reset_settings():
    """Reset settings.json from example data."""
    example_settings = EXAMPLE_DATA_DIR / 'settings.json'
    dest_settings = CONTENT_DIR / 'settings.json'

    if not example_settings.exists():
        print_error(f"Example settings.json not found at {example_settings}")
        return False

    # Load example settings
    with open(example_settings, 'r') as f:
        settings = json.load(f)

    # Load experiences from separate file if it exists
    example_experiences = EXAMPLE_DATA_DIR / 'experiences.json'
    if example_experiences.exists():
        with open(example_experiences, 'r') as f:
            exp_data = json.load(f)
            settings['experiences'] = exp_data

    # Write to content directory
    with open(dest_settings, 'w') as f:
        json.dump(settings, f, indent=2)

    print_step(f"Reset settings.json")
    return True


def reset_views():
    """Reset views directory from example data."""
    # Remove existing views
    remove_directory_contents(VIEWS_DIR)

    # Copy example views
    copy_directory_contents(EXAMPLE_VIEWS_DIR, VIEWS_DIR)


def reset_posts():
    """Reset posts directory from example data."""
    # Remove existing posts
    remove_directory_contents(POSTS_DIR)

    # Copy example posts
    copy_directory_contents(EXAMPLE_POSTS_DIR, POSTS_DIR)


def reset_experiences():
    """Reset experiences directory from example data."""
    # Remove existing experiences
    remove_directory_contents(EXPERIENCES_DIR)

    # Copy example experiences
    copy_directory_contents(EXAMPLE_EXPERIENCES_DIR, EXPERIENCES_DIR)


def reset_data():
    """Reset all data (views, posts, experiences) but not settings."""
    print_step("Resetting data files...")

    reset_views()
    reset_posts()
    reset_experiences()

    print_success("Data reset complete!")


def reset_all():
    """Reset everything including settings."""
    print_step("Resetting all content files...")

    # Ensure content directory exists
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    # Reset everything
    reset_settings()
    reset_views()
    reset_posts()
    reset_experiences()

    print_success("Full reset complete!")


# ============ Interactive Mode Functions ============

def edit_json_with_editor(data: Dict[str, Any], description: str) -> Dict[str, Any]:
    """
    Open JSON data in the system editor for editing.
    Uses $EDITOR environment variable or falls back to common editors.
    """
    # Get the editor from environment or use fallbacks
    editor = os.environ.get('EDITOR') or os.environ.get('VISUAL')
    if not editor:
        # Try common editors
        for ed in ['nano', 'vim', 'vi', 'code --wait', 'subl --wait']:
            if shutil.which(ed.split()[0]):
                editor = ed
                break

    if not editor:
        print_error("No editor found. Set $EDITOR environment variable.")
        return data

    # Create temporary file with JSON content
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
        json.dump(data, f, indent=2)
        temp_path = f.name

    try:
        print_info(f"Opening {description} in {editor}...")
        print_info("Save and close the editor when done.")

        # Open editor
        subprocess.run(editor.split() + [temp_path], check=True)

        # Read back the edited content
        with open(temp_path, 'r') as f:
            try:
                edited_data = json.load(f)
                print_success("Changes loaded successfully.")
                return edited_data
            except json.JSONDecodeError as e:
                print_error(f"Invalid JSON: {e}")
                retry = input("Would you like to retry editing? (y/n): ").strip().lower()
                if retry == 'y':
                    return edit_json_with_editor(data, description)
                return data
    finally:
        os.unlink(temp_path)


def get_all_steps() -> List[ResetStep]:
    """Build the list of all reset steps with their data."""
    steps = []

    # Settings step
    example_settings = EXAMPLE_DATA_DIR / 'settings.json'
    if example_settings.exists():
        with open(example_settings, 'r') as f:
            settings_data = json.load(f)

        # Also load experiences if available
        example_experiences = EXAMPLE_DATA_DIR / 'experiences.json'
        if example_experiences.exists():
            with open(example_experiences, 'r') as f:
                settings_data['experiences'] = json.load(f)

        steps.append(ResetStep(
            id="settings",
            name="Reset Settings",
            description="Reset settings.json (themes, navigation, experiences)",
            action=lambda d: write_settings(d),
            data=settings_data
        ))

    # Views steps - one per view file
    if EXAMPLE_VIEWS_DIR.exists():
        for view_file in sorted(EXAMPLE_VIEWS_DIR.glob('*.json')):
            with open(view_file, 'r') as f:
                view_data = json.load(f)

            view_name = view_file.stem
            steps.append(ResetStep(
                id=f"view_{view_name}",
                name=f"Reset View: {view_name}",
                description=f"Reset {view_file.name} view configuration",
                action=lambda d, vf=view_file: write_view(d, vf.name),
                data=view_data
            ))

    # Posts steps - one per post file
    if EXAMPLE_POSTS_DIR.exists():
        for post_file in sorted(EXAMPLE_POSTS_DIR.glob('*.md')):
            with open(post_file, 'r') as f:
                post_content = f.read()

            post_name = post_file.stem
            steps.append(ResetStep(
                id=f"post_{post_name}",
                name=f"Reset Post: {post_name}",
                description=f"Reset {post_file.name} markdown file",
                action=lambda c, pf=post_file: write_post(c, pf.name),
                data={"content": post_content, "filename": post_file.name}
            ))

    return steps


def write_settings(data: Dict[str, Any]) -> bool:
    """Write settings data to settings.json."""
    dest_settings = CONTENT_DIR / 'settings.json'
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    with open(dest_settings, 'w') as f:
        json.dump(data, f, indent=2)

    print_step("Wrote settings.json")
    return True


def write_view(data: Dict[str, Any], filename: str) -> bool:
    """Write view data to views directory."""
    VIEWS_DIR.mkdir(parents=True, exist_ok=True)

    dest_file = VIEWS_DIR / filename
    with open(dest_file, 'w') as f:
        json.dump(data, f, indent=2)

    print_step(f"Wrote view: {filename}")
    return True


def write_post(data: Dict[str, Any], filename: str) -> bool:
    """Write post content to posts directory."""
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    dest_file = POSTS_DIR / filename
    with open(dest_file, 'w') as f:
        f.write(data.get("content", ""))

    print_step(f"Wrote post: {filename}")
    return True


def write_example_data(data: Dict[str, Any], step: ResetStep):
    """Write modified data back to example_data (permanent change)."""
    if step.id == "settings":
        example_settings = EXAMPLE_DATA_DIR / 'settings.json'
        # Separate experiences if present
        experiences = data.pop('experiences', None)

        with open(example_settings, 'w') as f:
            json.dump(data, f, indent=2)

        if experiences:
            example_experiences = EXAMPLE_DATA_DIR / 'experiences.json'
            with open(example_experiences, 'w') as f:
                json.dump(experiences, f, indent=2)
            data['experiences'] = experiences

        print_success("Updated example settings.json permanently")

    elif step.id.startswith("view_"):
        view_name = step.id.replace("view_", "")
        view_file = EXAMPLE_VIEWS_DIR / f"{view_name}.json"
        with open(view_file, 'w') as f:
            json.dump(data, f, indent=2)
        print_success(f"Updated example view {view_name}.json permanently")

    elif step.id.startswith("post_"):
        post_name = step.id.replace("post_", "")
        # Find the original file
        for post_file in EXAMPLE_POSTS_DIR.glob(f"{post_name}*"):
            with open(post_file, 'w') as f:
                f.write(data.get("content", ""))
            print_success(f"Updated example post {post_file.name} permanently")
            break


def display_summary(steps: List[ResetStep]):
    """Display a summary of what will be reset."""
    print_header("Reset Summary")

    print(f"{Colors.BOLD}The following items will be reset:{Colors.RESET}\n")

    settings_steps = [s for s in steps if s.id == "settings"]
    view_steps = [s for s in steps if s.id.startswith("view_")]
    post_steps = [s for s in steps if s.id.startswith("post_")]

    if settings_steps:
        print(f"  {Colors.CYAN}Settings:{Colors.RESET}")
        for step in settings_steps:
            print(f"    - {step.description}")

    if view_steps:
        print(f"\n  {Colors.CYAN}Views ({len(view_steps)} files):{Colors.RESET}")
        for step in view_steps:
            print(f"    - {step.name.replace('Reset View: ', '')}")

    if post_steps:
        print(f"\n  {Colors.CYAN}Posts ({len(post_steps)} files):{Colors.RESET}")
        for step in post_steps:
            print(f"    - {step.name.replace('Reset Post: ', '')}")

    print()


def load_saved_configs() -> List[Dict[str, Any]]:
    """Load all saved configurations from the configs directory."""
    configs = []
    CONFIGS_DIR.mkdir(parents=True, exist_ok=True)

    for config_file in sorted(CONFIGS_DIR.glob('*.json')):
        try:
            with open(config_file, 'r') as f:
                config = json.load(f)
                config['_filename'] = config_file.name
                configs.append(config)
        except (json.JSONDecodeError, IOError):
            continue

    return configs


def save_config(session: InteractiveSession, name: str):
    """Save the current session configuration."""
    CONFIGS_DIR.mkdir(parents=True, exist_ok=True)

    # Sanitize filename
    safe_name = "".join(c for c in name if c.isalnum() or c in "._- ").strip()
    if not safe_name:
        safe_name = "config"

    config = {
        "name": name,
        "included_steps": [s.id for s in session.steps if s.status == StepStatus.INCLUDED],
        "omitted_steps": [s.id for s in session.steps if s.status == StepStatus.OMITTED],
        "special_selections": session.special_selections
    }

    config_path = CONFIGS_DIR / f"{safe_name}.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    print_success(f"Configuration saved to {config_path}")


def apply_saved_config(session: InteractiveSession, config: Dict[str, Any]):
    """Apply a saved configuration to the current session."""
    included = set(config.get('included_steps', []))
    omitted = set(config.get('omitted_steps', []))

    for step in session.steps:
        if step.id in omitted:
            step.status = StepStatus.OMITTED
        elif step.id in included:
            step.status = StepStatus.INCLUDED
        else:
            step.status = StepStatus.INCLUDED  # Default to included

    session.special_selections = config.get('special_selections', {})
    print_success(f"Applied configuration: {config.get('name', 'unnamed')}")


def interactive_menu(session: InteractiveSession):
    """Display the main interactive menu and handle user input."""
    while True:
        print_header("Interactive Reset Menu")

        # Show current step status summary
        included = sum(1 for s in session.steps if s.status in [StepStatus.PENDING, StepStatus.INCLUDED])
        omitted = sum(1 for s in session.steps if s.status == StepStatus.OMITTED)

        print(f"  Steps: {len(session.steps)} total, {included} included, {omitted} omitted\n")

        print(f"  {Colors.BOLD}Options:{Colors.RESET}")
        print(f"    1. Pick specific steps to include")
        print(f"    2. Omit specific steps")
        print(f"    3. Run all selected steps")
        print(f"    4. Run all non-omitted steps")
        print(f"    5. Step through each step interactively")
        print(f"    6. Search saved configurations")
        print(f"    7. View current step selections")
        print(f"    8. Reset all selections")
        print(f"    9. Exit without making changes")
        print()

        choice = input(f"{Colors.CYAN}Enter your choice (1-9):{Colors.RESET} ").strip()

        if choice == '1':
            pick_steps(session)
        elif choice == '2':
            omit_steps(session)
        elif choice == '3':
            run_selected_steps(session)
            break
        elif choice == '4':
            run_non_omitted_steps(session)
            break
        elif choice == '5':
            step_through_interactive(session)
            break
        elif choice == '6':
            search_configs(session)
        elif choice == '7':
            view_selections(session)
        elif choice == '8':
            for step in session.steps:
                step.status = StepStatus.PENDING
            print_success("All selections reset")
        elif choice == '9':
            print_info("Exiting without changes.")
            return
        else:
            print_error("Invalid choice. Please enter 1-9.")


def pick_steps(session: InteractiveSession):
    """Let user pick specific steps to include."""
    print_header("Pick Steps to Include")

    for i, step in enumerate(session.steps, 1):
        status_icon = "✓" if step.status == StepStatus.INCLUDED else "○"
        print(f"  {i}. [{status_icon}] {step.name}")

    print()
    print("Enter step numbers to toggle (comma-separated), or 'all' for all, 'done' to finish:")

    selection = input(f"{Colors.CYAN}>{Colors.RESET} ").strip().lower()

    if selection == 'all':
        for step in session.steps:
            step.status = StepStatus.INCLUDED
        print_success("All steps marked as included")
    elif selection == 'done':
        return
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            for idx in indices:
                if 0 <= idx < len(session.steps):
                    step = session.steps[idx]
                    if step.status == StepStatus.INCLUDED:
                        step.status = StepStatus.PENDING
                    else:
                        step.status = StepStatus.INCLUDED
            print_success("Selections updated")
        except ValueError:
            print_error("Invalid input. Use numbers separated by commas.")


def omit_steps(session: InteractiveSession):
    """Let user omit specific steps."""
    print_header("Omit Steps")

    for i, step in enumerate(session.steps, 1):
        status_icon = "✗" if step.status == StepStatus.OMITTED else "○"
        print(f"  {i}. [{status_icon}] {step.name}")

    print()
    print("Enter step numbers to toggle omit (comma-separated), or 'done' to finish:")

    selection = input(f"{Colors.CYAN}>{Colors.RESET} ").strip().lower()

    if selection == 'done':
        return
    else:
        try:
            indices = [int(x.strip()) - 1 for x in selection.split(',')]
            for idx in indices:
                if 0 <= idx < len(session.steps):
                    step = session.steps[idx]
                    if step.status == StepStatus.OMITTED:
                        step.status = StepStatus.PENDING
                    else:
                        step.status = StepStatus.OMITTED
            print_success("Omissions updated")
        except ValueError:
            print_error("Invalid input. Use numbers separated by commas.")


def view_selections(session: InteractiveSession):
    """Display current step selections."""
    print_header("Current Selections")

    included = [s for s in session.steps if s.status in [StepStatus.PENDING, StepStatus.INCLUDED]]
    omitted = [s for s in session.steps if s.status == StepStatus.OMITTED]

    print(f"  {Colors.GREEN}Included ({len(included)}):{Colors.RESET}")
    for step in included:
        print(f"    - {step.name}")

    if omitted:
        print(f"\n  {Colors.RED}Omitted ({len(omitted)}):{Colors.RESET}")
        for step in omitted:
            print(f"    - {step.name}")

    print()
    input("Press Enter to continue...")


def search_configs(session: InteractiveSession):
    """Search and load saved configurations."""
    configs = load_saved_configs()

    if not configs:
        print_info("No saved configurations found.")
        input("Press Enter to continue...")
        return

    print_header("Saved Configurations")

    for i, config in enumerate(configs, 1):
        name = config.get('name', 'Unnamed')
        included = len(config.get('included_steps', []))
        omitted = len(config.get('omitted_steps', []))
        print(f"  {i}. {name} ({included} included, {omitted} omitted)")

    print()
    print("Enter number to load, or 'cancel' to go back:")

    selection = input(f"{Colors.CYAN}>{Colors.RESET} ").strip().lower()

    if selection == 'cancel':
        return

    try:
        idx = int(selection) - 1
        if 0 <= idx < len(configs):
            apply_saved_config(session, configs[idx])
        else:
            print_error("Invalid selection.")
    except ValueError:
        print_error("Invalid input.")


def run_selected_steps(session: InteractiveSession):
    """Run only explicitly selected (included) steps."""
    steps_to_run = [s for s in session.steps if s.status == StepStatus.INCLUDED]

    if not steps_to_run:
        print_error("No steps selected. Use option 1 to pick steps first.")
        return

    print_header("Running Selected Steps")

    # Clear existing content first if we have any steps
    clear_content_before_reset(steps_to_run)

    for step in steps_to_run:
        data = step.modified_data if step.modified_data else step.data
        step.action(data)
        step.status = StepStatus.COMPLETED

    show_completion_summary(session)


def run_non_omitted_steps(session: InteractiveSession):
    """Run all steps except explicitly omitted ones."""
    steps_to_run = [s for s in session.steps if s.status != StepStatus.OMITTED]

    print_header("Running Non-Omitted Steps")

    # Clear existing content first
    clear_content_before_reset(steps_to_run)

    for step in steps_to_run:
        data = step.modified_data if step.modified_data else step.data
        step.action(data)
        step.status = StepStatus.COMPLETED

    show_completion_summary(session)


def clear_content_before_reset(steps: List[ResetStep]):
    """Clear content directories before reset based on what steps will be run."""
    has_settings = any(s.id == "settings" for s in steps)
    has_views = any(s.id.startswith("view_") for s in steps)
    has_posts = any(s.id.startswith("post_") for s in steps)

    CONTENT_DIR.mkdir(parents=True, exist_ok=True)

    if has_views:
        remove_directory_contents(VIEWS_DIR)
    if has_posts:
        remove_directory_contents(POSTS_DIR)


def step_through_interactive(session: InteractiveSession):
    """Step through each step interactively with edit options."""
    steps_to_run = [s for s in session.steps if s.status != StepStatus.OMITTED]

    if not steps_to_run:
        print_info("All steps are omitted.")
        return

    print_header("Interactive Step-Through Mode")
    print_info("For each step, you can edit values, update defaults, or execute.")
    print()

    # Clear content directories first
    clear_content_before_reset(steps_to_run)

    for i, step in enumerate(steps_to_run, 1):
        print(f"\n{Colors.BOLD}Step {i}/{len(steps_to_run)}: {step.name}{Colors.RESET}")
        print(f"  {step.description}")
        print()

        current_data = step.modified_data if step.modified_data else step.data

        while True:
            print(f"  {Colors.BOLD}Options:{Colors.RESET}")
            print(f"    1. Edit value (for this run only)")
            print(f"    2. Edit default permanently")
            print(f"    3. Perform step")
            print(f"    4. Skip this step")
            print(f"    5. View current data")
            print()

            choice = input(f"{Colors.CYAN}Choice (1-5):{Colors.RESET} ").strip()

            if choice == '1':
                edited = edit_json_with_editor(current_data.copy(), step.name)
                step.modified_data = edited
                current_data = edited
                session.special_selections[step.id] = "edited"
                print_success("Value edited for this run.")

            elif choice == '2':
                edited = edit_json_with_editor(current_data.copy(), step.name)
                step.modified_data = edited
                current_data = edited
                # Write back to example_data
                write_example_data(edited, step)
                session.permanent_changes.append(f"Updated default for: {step.name}")
                session.special_selections[step.id] = "permanent_edit"

            elif choice == '3':
                step.action(current_data)
                step.status = StepStatus.COMPLETED
                print_success(f"Completed: {step.name}")
                break

            elif choice == '4':
                step.status = StepStatus.OMITTED
                session.special_selections[step.id] = "skipped"
                print_info(f"Skipped: {step.name}")
                break

            elif choice == '5':
                print(f"\n{Colors.CYAN}Current data:{Colors.RESET}")
                print(json.dumps(current_data, indent=2)[:2000])  # Limit output
                if len(json.dumps(current_data, indent=2)) > 2000:
                    print("... (truncated)")
                print()

            else:
                print_error("Invalid choice. Enter 1-5.")

    show_completion_summary(session)


def show_completion_summary(session: InteractiveSession):
    """Show summary after all steps complete and offer to save configuration."""
    print_header("Reset Complete")

    completed = [s for s in session.steps if s.status == StepStatus.COMPLETED]
    skipped = [s for s in session.steps if s.status == StepStatus.OMITTED]

    print(f"{Colors.GREEN}Completed ({len(completed)}):{Colors.RESET}")
    for step in completed:
        indicator = " (edited)" if session.special_selections.get(step.id) else ""
        print(f"  ✓ {step.name}{indicator}")

    if skipped:
        print(f"\n{Colors.YELLOW}Skipped ({len(skipped)}):{Colors.RESET}")
        for step in skipped:
            print(f"  - {step.name}")

    if session.permanent_changes:
        print(f"\n{Colors.MAGENTA}Permanent Changes Made:{Colors.RESET}")
        for change in session.permanent_changes:
            print(f"  • {change}")

    if session.special_selections:
        print(f"\n{Colors.CYAN}Special Selections This Run:{Colors.RESET}")
        for step_id, selection in session.special_selections.items():
            step = next((s for s in session.steps if s.id == step_id), None)
            if step:
                print(f"  • {step.name}: {selection}")

    print()
    save_choice = input("Would you like to save this configuration? (y/n): ").strip().lower()

    if save_choice == 'y':
        config_name = input("Enter a name for this configuration: ").strip()
        if config_name:
            save_config(session, config_name)
        else:
            print_info("No name provided, skipping save.")

    print_success("Done!")


def run_interactive():
    """Run the interactive reset mode."""
    print_header("Interactive Reset Mode")

    # Build steps
    steps = get_all_steps()

    if not steps:
        print_error("No example data found to reset from.")
        return

    # Create session
    session = InteractiveSession(steps=steps)

    # Show summary first
    display_summary(steps)

    # Run interactive menu
    interactive_menu(session)


def main():
    # Check that example_data directory exists
    if not EXAMPLE_DATA_DIR.exists():
        print_error(f"Example data directory not found at {EXAMPLE_DATA_DIR}")
        print_error("Please create the example_data/ directory with your seed data.")
        sys.exit(1)

    # Parse command line arguments
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == '--data-only':
            reset_data()
        elif arg == '--settings-only':
            reset_settings()
            print_success("Settings reset complete!")
        elif arg == '--interactive':
            run_interactive()
        elif arg == '--help' or arg == '-h':
            print(__doc__)
        else:
            print_error(f"Unknown argument: {arg}")
            print(__doc__)
            sys.exit(1)
    else:
        reset_all()


if __name__ == '__main__':
    main()

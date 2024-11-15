#!/usr/bin/env -S just --justfile

_default:
  @just --list -u

alias r := ready

# Make sure you have cargo-binstall installed.
# You can download the pre-compiled binary from <https://github.com/cargo-bins/cargo-binstall#installation>
# or install via `cargo install cargo-binstall`
# Initialize the project by installing all the necessary tools.
init:
  cargo binstall bacon typos-cli taplo-cli cargo-llvm-cov -y

install:
  pnpm install
  cd fixtures/pnp && yarn

# When ready, run the same CI commands
ready:
  git diff --exit-code --quiet
  typos
  cargo fmt
  just check
  just test
  just lint
  git status

watch:
  bacon

# Run the example in `parser`, `formatter`, `linter`
example *args='':
  bacon example -- {{args}}

# Format all files
fmt:
  cargo fmt
  taplo format

# Run cargo check
check:
  cargo check --all-features --all-targets

# Run all the tests
test:
  cargo test --all-features

# Lint the whole project
lint:
  cargo clippy --all-features -- --deny warnings

# Generate doc
doc:
  RUSTDOCFLAGS='-D warnings' cargo doc --no-deps --all-features

# Get code coverage
codecov:
  cargo codecov --html

# Run the benchmarks.
benchmark:
  cargo bench

# Run cargo-fuzz
fuzz:
  cd fuzz && cargo +nightly fuzz run --sanitizer none resolver -- -only_ascii=1 -max_total_time=900

# Manual Release
release:
  cargo binstall -y release-plz
  release-plz update
  just check
  # NOTE: make sure to update version in npm/package.json

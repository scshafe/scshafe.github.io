## Local Setup

#### Install rbenv

Do not use apt for rbenv installation, it has old versions of ruby that caused issues in wsl. Instead use these [Instructions](https://www.digitalocean.com/community/tutorials/how-to-install-ruby-on-rails-with-rbenv-on-ubuntu-20-04)

#### Use rbenv to install the stable ruby version
```
$ cat .ruby-version | rbenv install

```

#### Build project

```
$ gem install jekyll bundler

$ bundle install 

$ bundle exec jekyll server
```


